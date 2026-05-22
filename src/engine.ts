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
}
