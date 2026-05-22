import { OrchestrationConfig, StepConfig } from './parser';
import { RepresentativeAgent } from './agent/representative';
import { RunnerAgent } from './agent/runner';
import { ExplorerAgent } from './agent/explorer';
import { WriterAgent } from './agent/writer';
import { ReviewerAgent } from './agent/reviewer';
import { EditorAgent } from './agent/editor';
import { FormatterAgent } from './agent/formatter';
import { Logger } from './utils/logger';
import { readMarkdownFile } from './utils/markdown-helper';
import { TokenLogger } from './utils/token-logger';
import * as fs from 'fs';
import * as path from 'path';

export class WorkflowEngine {
  private config: OrchestrationConfig;
  private repAgent?: RepresentativeAgent;
  private runners: Map<string, RunnerAgent> = new Map();
  private retryCounts: Map<number, number> = new Map();

  constructor(config: OrchestrationConfig) {
    this.config = config;
    this.initializeAgents();
  }

  private initializeAgents(): void {
    const workspaceDir = this.config.global_settings.workspace_dir;
    for (const agentConf of this.config.agents) {
      if (agentConf.role === 'representative') {
        this.repAgent = new RepresentativeAgent(agentConf.id, agentConf.persona, workspaceDir);
      } else {
        let runner: RunnerAgent;
        switch (agentConf.role) {
          case 'explorer':
            runner = new ExplorerAgent(agentConf.id, agentConf.role, agentConf.persona, workspaceDir);
            break;
          case 'writer':
            runner = new WriterAgent(agentConf.id, agentConf.role, agentConf.persona, workspaceDir);
            break;
          case 'reviewer':
            runner = new ReviewerAgent(agentConf.id, agentConf.role, agentConf.persona, workspaceDir, agentConf.criteria);
            break;
          case 'editor':
            runner = new EditorAgent(agentConf.id, agentConf.role, agentConf.persona, workspaceDir);
            break;
          case 'formatter':
            runner = new FormatterAgent(agentConf.id, agentConf.role, agentConf.persona, workspaceDir);
            break;
          default:
            throw new Error(`Unknown agent role: ${agentConf.role}`);
        }
        this.runners.set(agentConf.id, runner);
      }
    }
  }

  public async run(): Promise<void> {
    Logger.info('Starting Workflow Engine in Host-Agent Delegation Mode...');

    if (this.repAgent) {
      await this.repAgent.execute();
    }

    let currentStepIndex = 0;

    while (currentStepIndex < this.config.workflow.length) {
      const step = this.config.workflow[currentStepIndex];
      Logger.info(`Executing Step ${step.step} - Type: ${step.type}`);
      
      const success = await this.executeStep(step);

      // Reviewer에 의한 점수 미달(실패) 로직 처리
      if (!success && step.type === 'feedback_loop') {
        const retries = this.retryCounts.get(step.step) || 0;
        const maxRetries = step.max_iterations || 3;

        if (retries < maxRetries) {
          this.retryCounts.set(step.step, retries + 1);
          Logger.warn(`Step ${step.step} failed. Retrying... (${retries + 1}/${maxRetries})`);
          
          // 여기서 on_fail 타겟 스텝 인덱스로 돌아가는 로직 추가 가능 (단순화를 위해 바로 이전 스텝으로 이동)
          currentStepIndex = Math.max(0, currentStepIndex - 1);
          continue;
        } else {
          Logger.error(`Max retries reached for Step ${step.step}. Requesting user intervention...`);
          if (this.repAgent) {
            await this.repAgent.waitForUserFeedback(`Step ${step.step} failed multiple times. Please review the workspace, correct the issue, and change my status to Completed to continue.`);
          }
        }
      }

      currentStepIndex++;
    }

    Logger.success('All workflow steps completed successfully.');
    await this.postProcess();
    this.cleanup();
  }

  private async executeStep(step: StepConfig): Promise<boolean> {
    let allSuccess = true;

    if (step.type === 'parallel') {
      const promises = step.agents.map(async agentId => {
        const runner = this.runners.get(agentId);
        if (!runner) throw new Error(`Agent ${agentId} not found.`);
        await runner.execute(); 
      });
      await Promise.all(promises);
    } else {
      for (const agentId of step.agents) {
        const runner = this.runners.get(agentId);
        if (runner) {
          await runner.execute();
          
          // 만약 이 에이전트가 Reviewer 라면 호스트가 채점한 점수를 확인
          if (runner instanceof ReviewerAgent && step.threshold_score) {
             // 리뷰어의 가장 최근 상태를 읽어온다 (실제론 파일명 등을 추적해야 하나 간이 구현)
             const statusPath = path.join(this.config.global_settings.workspace_dir, agentId, 'current_status.md');
             if (fs.existsSync(statusPath)) {
               const { frontmatter } = readMarkdownFile(statusPath);
               const score = frontmatter.score || 0;
               Logger.info(`Reviewer ${agentId} gave a score of ${score}. (Threshold: ${step.threshold_score})`);
               if (score < step.threshold_score) {
                 allSuccess = false;
                 // 반려
               }
             }
          }

        } else if (agentId === this.repAgent?.id && step.type === 'feedback_loop') {
          const feedback = await this.repAgent.waitForUserFeedback(`User intervention requested at step ${step.step}`);
          Logger.info(`Feedback received: ${feedback.substring(0, 30)}...`);
        } else {
          Logger.warn(`Agent ${agentId} not found in step ${step.step}`);
        }
      }
    }
    
    return allSuccess;
  }

  private cleanup(): void {
    if (this.repAgent) {
      this.repAgent.cleanup();
    }
  }

  /**
   * 워크플로우 성공 완료 후 후속 작업(토큰 로그파일 쓰기, 최종 보고서 export 복사, 요약 리포트 자동/수동 생성)을 진행합니다.
   * Performs post-processing tasks after workflow completion (writing token log, copying final report to export, generating summary report).
   */
  private async postProcess(): Promise<void> {
    const workspaceDir = this.config.global_settings.workspace_dir;
    
    // 1. 토큰 최종 보고서 파일 작성 (token_usage.log)
    // 1. Write the final token usage log file (token_usage.log)
    TokenLogger.writeFinalLog(workspaceDir);

    // 2. 최종 산출물 복사 (data_paths 감지 및 복사)
    // 2. Copy the final deliverables (detect and copy data_paths)
    const exportDir = path.resolve(process.cwd(), this.config.global_settings.export_dir || './export');
    
    // 마지막 에이전트(주로 Formatter)의 상태 파일 찾기
    // Find the state file of the last agent (usually Formatter)
    let finalFiles: string[] = [];
    const formatterAgent = this.config.agents.find(a => a.role === 'formatter');
    const lastAgentId = formatterAgent ? formatterAgent.id : (this.config.agents[this.config.agents.length - 1]?.id);

    if (lastAgentId) {
      const statusPath = path.join(workspaceDir, lastAgentId, 'current_status.md');
      if (fs.existsSync(statusPath)) {
        try {
          const { frontmatter } = readMarkdownFile(statusPath);
          if (frontmatter.data_paths && Array.isArray(frontmatter.data_paths)) {
            finalFiles = frontmatter.data_paths.map(p => path.resolve(workspaceDir, lastAgentId, p));
          }
        } catch (e: any) {
          Logger.warn(`Failed to parse final agent status for exporting: ${e.message}`);
        }
      }
    }

    if (finalFiles.length > 0) {
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      finalFiles.forEach(file => {
        if (fs.existsSync(file)) {
          const dest = path.join(exportDir, path.basename(file));
          fs.copyFileSync(file, dest);
          Logger.success(`Copied final deliverable to export folder: ${dest}`);
        }
      });
    } else {
      Logger.warn('No final deliverables found in agent status metadata to export.');
    }

    // 3. 작업 요약 생성 결정 (자동 또는 수동 피드백 요청)
    // 3. Determine whether to generate work summary (automatic or manual feedback request)
    const generateSummary = this.config.global_settings.generate_work_summary === true;
    let shouldGenerate = generateSummary;

    if (!generateSummary && this.repAgent) {
      // settings가 false인 경우 사용자에게 질문
      // If settings are false, ask the user
      const userResponse = await this.repAgent.waitForUserFeedback(
        'All workflow steps completed. Do you want to generate a work summary report in the export folder? (Type "yes" or "y" to generate)'
      );
      const cleanedResponse = userResponse.trim().toLowerCase();
      if (cleanedResponse === 'yes' || cleanedResponse === 'y') {
        shouldGenerate = true;
      }
    }

    if (shouldGenerate) {
      // 보고서 이름 결정 (첫 번째 복사된 파일명 베이스, 없으면 기본명)
      // Determine summary report filename based on first copied file
      let baseName = 'work_summary';
      if (finalFiles.length > 0) {
        const ext = path.extname(finalFiles[0]);
        baseName = path.basename(finalFiles[0], ext) + '_summary';
      } else {
        if (!fs.existsSync(exportDir)) {
          fs.mkdirSync(exportDir, { recursive: true });
        }
      }
      const summaryReportPath = path.join(exportDir, `${baseName}.md`);
      
      // 요약 정보 수집 및 작성
      // Collect and write summary information
      this.generateSummaryReport(summaryReportPath);
    }
  }

  /**
   * 에이전트 상태 파일 및 상세 대화 로그를 취합하여 최종 요약 보고서를 작성합니다.
   * Compiles agent status files and message history to write the final summary report.
   * @param outputPath 저장될 요약 보고서 마크다운 경로 / Path to write the summary report markdown
   */
  private generateSummaryReport(outputPath: string): void {
    const workspaceDir = this.config.global_settings.workspace_dir;
    let report = `# 글타래로 (Geultaraero) 작업 요약 보고서 (Work Summary Report)\n\n`;
    report += `**생성 일시 (Generated At):** ${new Date().toISOString()}\n\n`;
    report += `---\n\n`;
    report += `## 1. 에이전트별 작업 이력 (Agent Execution History)\n\n`;

    this.config.agents.forEach(agent => {
      const statusPath = path.join(workspaceDir, agent.id, 'current_status.md');
      report += `### 🤖 ${agent.id} (${agent.role})\n`;
      report += `- **Persona:** ${agent.persona}\n`;

      if (fs.existsSync(statusPath)) {
        try {
          const { frontmatter, content } = readMarkdownFile(statusPath);
          report += `- **Status:** ${frontmatter.status}\n`;
          report += `- **Completed Time:** ${frontmatter.timestamp || 'N/A'}\n`;
          if (frontmatter.token_usage) {
            report += `- **Token Usage:** ${frontmatter.token_usage.total_tokens || 0} tokens\n`;
          }
          report += `\n**작업 요약 (Work Details):**\n\`\`\`markdown\n${content}\n\`\`\`\n`;
        } catch (e: any) {
          report += `*(상태 파싱 실패 / Failed to parse status)*\n`;
        }
      } else {
        report += `*(상태 파일 없음 / No status file found)*\n`;
      }
      report += `\n`;
    });

    report += `---\n\n`;
    report += `## 2. 에이전트 간 상세 메시지 송수신 내역 (Detailed Messages History)\n\n`;

    let hasMessages = false;
    this.config.agents.forEach(agent => {
      const agentDir = path.join(workspaceDir, agent.id);
      if (fs.existsSync(agentDir)) {
        const files = fs.readdirSync(agentDir);
        // msg_로 시작하는 파일 수집
        // Collect files starting with msg_
        const msgFiles = files.filter(f => f.startsWith('msg_') && f.endsWith('.md')).sort();
        if (msgFiles.length > 0) {
          hasMessages = true;
          report += `### ✉️ ${agent.id} 에이전트 수신 메시지 (Received Messages)\n\n`;
          msgFiles.forEach(file => {
            try {
              const { frontmatter, content } = readMarkdownFile(path.join(agentDir, file));
              report += `#### [${frontmatter.message_type}] From: ${frontmatter.sender} -> To: ${frontmatter.receiver || agent.id}\n`;
              report += `- **Time:** ${frontmatter.timestamp}\n`;
              report += `\n**Message Content:**\n${content}\n\n`;
            } catch (e) {}
          });
        }
      }
    });

    if (!hasMessages) {
      report += `*(송수신된 개별 메시지가 없습니다 / No individual messages were routed)*\n`;
    }

    try {
      fs.writeFileSync(outputPath, report, 'utf-8');
      Logger.success(`Work summary report successfully created at: ${outputPath}`);
    } catch (e: any) {
      Logger.error(`Failed to generate work summary report: ${e.message}`);
    }
  }
}
