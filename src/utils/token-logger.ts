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
}
