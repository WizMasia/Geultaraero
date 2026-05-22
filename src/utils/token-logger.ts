import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface TokenHistoryEntry {
  agentId: string;
  timestamp: string;
  usage: TokenUsage;
}

export interface TokenUsageSummary {
  total_accumulated: TokenUsage;
  history: TokenHistoryEntry[];
}

export class TokenLogger {
  /**
   * 토큰 사용량을 기록하고 누적 요약을 갱신합니다.
   * Records token usage and updates the accumulated summary.
   * @param agentId 에이전트 식별자 / Agent identifier
   * @param usage 입력받은 토큰 사용량 객체 / Received token usage object
   * @param workspaceDir 워크스페이스 디렉토리 경로 / Workspace directory path
   */
  public static logUsage(agentId: string, usage: any, workspaceDir: string): void {
    if (!usage) return;

    // 안전한 타입 검사 및 파싱
    // Safe type checking and parsing
    const prompt_tokens = Number(usage.prompt_tokens) || 0;
    const completion_tokens = Number(usage.completion_tokens) || 0;
    const total_tokens = Number(usage.total_tokens) || (prompt_tokens + completion_tokens);

    if (prompt_tokens === 0 && completion_tokens === 0 && total_tokens === 0) {
      return;
    }

    const tokenUsage: TokenUsage = {
      prompt_tokens,
      completion_tokens,
      total_tokens
    };

    const summaryPath = path.join(workspaceDir, 'token_usage_summary.json');
    let summary: TokenUsageSummary = {
      total_accumulated: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      history: []
    };

    try {
      if (fs.existsSync(summaryPath)) {
        const fileContent = fs.readFileSync(summaryPath, 'utf-8');
        summary = JSON.parse(fileContent);
      }
    } catch (e) {
      Logger.warn(`Failed to read token usage summary, initializing a new one. Error: ${e}`);
    }

    // 누적 합산 갱신
    // Update accumulated total
    summary.total_accumulated.prompt_tokens += tokenUsage.prompt_tokens;
    summary.total_accumulated.completion_tokens += tokenUsage.completion_tokens;
    summary.total_accumulated.total_tokens += tokenUsage.total_tokens;

    // 히스토리 항목 추가
    // Add history entry
    summary.history.push({
      agentId,
      timestamp: new Date().toISOString(),
      usage: tokenUsage
    });

    try {
      // 디렉토리가 없을 수도 있으므로 재귀적으로 생성
      // Create directory recursively just in case it doesn't exist
      const dir = path.dirname(summaryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    } catch (e) {
      Logger.error(`Failed to write token usage summary to path: ${summaryPath}. Error: ${e}`);
    }

    // 콘솔에 이쁜 색상으로 로그 출력
    // Log to console with beautiful colors
    console.log(
      `\x1b[35m[TOKEN: ${agentId}]\x1b[0m Used \x1b[33m${tokenUsage.total_tokens.toLocaleString()}\x1b[0m tokens (Prompt: ${tokenUsage.prompt_tokens.toLocaleString()} / Completion: ${tokenUsage.completion_tokens.toLocaleString()})`
    );
    console.log(
      `\x1b[35m[TOKEN TOTAL]\x1b[0m Accumulated: \x1b[32m${summary.total_accumulated.total_tokens.toLocaleString()}\x1b[0m tokens`
    );
  }

  /**
   * 전체 워크플로우 완료 시 최종 토큰 소모 내역을 사람이 읽기 편한 로그 파일(token_usage.log)로 저장합니다.
   * At the end of the entire workflow, writes the final token usage report to a human-readable log file (token_usage.log).
   * @param workspaceDir 워크스페이스 디렉토리 경로 / Workspace directory path
   */
  public static writeFinalLog(workspaceDir: string): void {
    const summaryPath = path.join(workspaceDir, 'token_usage_summary.json');
    const logPath = path.join(workspaceDir, 'token_usage.log');

    if (!fs.existsSync(summaryPath)) {
      Logger.warn(`Cannot write final token log: ${summaryPath} does not exist.`);
      return;
    }

    try {
      const fileContent = fs.readFileSync(summaryPath, 'utf-8');
      const summary = JSON.parse(fileContent) as TokenUsageSummary;

      // 에이전트별 사용량 계산
      // Calculate usage by agent
      const agentBreakdowns: { [agentId: string]: TokenUsage } = {};
      summary.history.forEach(entry => {
        if (!agentBreakdowns[entry.agentId]) {
          agentBreakdowns[entry.agentId] = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        }
        agentBreakdowns[entry.agentId].prompt_tokens += entry.usage.prompt_tokens;
        agentBreakdowns[entry.agentId].completion_tokens += entry.usage.completion_tokens;
        agentBreakdowns[entry.agentId].total_tokens += entry.usage.total_tokens;
      });

      const now = new Date().toISOString();
      let logContent = `==================================================\n`;
      logContent += `Geultaraero Token Usage Report\n`;
      logContent += `Date: ${now}\n`;
      logContent += `==================================================\n`;
      logContent += `Total Accumulated Tokens: ${summary.total_accumulated.total_tokens.toLocaleString()} tokens\n`;
      logContent += `- Prompt Tokens: ${summary.total_accumulated.prompt_tokens.toLocaleString()} tokens\n`;
      logContent += `- Completion Tokens: ${summary.total_accumulated.completion_tokens.toLocaleString()} tokens\n\n`;
      logContent += `--------------------------------------------------\n`;
      logContent += `Agent Breakdowns:\n`;

      Object.keys(agentBreakdowns).forEach(agentId => {
        const usage = agentBreakdowns[agentId];
        logContent += `- ${agentId}: ${usage.total_tokens.toLocaleString()} tokens `;
        logContent += `(Prompt: ${usage.prompt_tokens.toLocaleString()} / Completion: ${usage.completion_tokens.toLocaleString()})\n`;
      });
      logContent += `==================================================\n`;

      fs.writeFileSync(logPath, logContent, 'utf-8');
      Logger.success(`Final token usage log recorded at: ${logPath}`);

      // 최종 통계 콘솔 요약 출력
      // Log final statistics summary to console
      console.log(`\n\x1b[35m[TOKEN FINAL REPORT]\x1b[0m`);
      console.log(`- Total: \x1b[32m${summary.total_accumulated.total_tokens.toLocaleString()}\x1b[0m tokens`);
      console.log(`- Log written to: ${logPath}\n`);
    } catch (e: any) {
      Logger.error(`Failed to write final token log: ${e.message}`);
    }
  }
}
