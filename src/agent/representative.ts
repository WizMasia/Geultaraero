import { BaseAgent } from './base';
import { FileWatcher } from '../utils/file-watcher';
import { Logger } from '../utils/logger';
import { TokenLogger } from '../utils/token-logger';
import * as path from 'path';

export class RepresentativeAgent extends BaseAgent {
  private watcher: FileWatcher;

  constructor(id: string, persona: string, workspaceDir: string) {
    super(id, 'representative', persona, workspaceDir);
    this.watcher = new FileWatcher(workspaceDir);
  }

  /**
   * 대표 에이전트는 유저의 입력을 대기하거나, 기획(Planning) 단계에서 자료 조사 및 목차 구조 계획서를 설계하고 다른 에이전트에게 지시를 내리는 역할을 합니다.
   * The Representative Agent waits for user inputs, drafts the Research & Structure Plan during the planning phase, and delegates instructions to other runner agents.
   */
  public async execute(): Promise<void> {
    Logger.agent(this.id, 'Representative Agent is now active.');
    // 기본 구현은 워크플로우 엔진에서 호출되며, 특정 시점에 기획 승인 또는 피드백 수집을 위해 개입.
    // The default implementation is invoked by the workflow engine, intervening to collect planning approvals or feedbacks.
  }

  /**
   * 사용자 피드백 및 기획 승인 대기 로직
   * Waiting logic for user feedback or Research & Structure Plan approval.
   * @param subject 검토 대상 문서 경로, 내용 요약 또는 기획서 내용 / Target document path, summary, or plan contents
   * @returns 사용자의 피드백 또는 승인 텍스트 / User feedback or approval text
   */
  public async waitForUserFeedback(subject: string): Promise<string> {
    Logger.agent(this.id, `Requesting user validation/feedback for: ${subject}`);
    
    // 상태를 waiting_for_user로 변경하며 기획/피드백 요청 본문을 전파
    // Change status to waiting_for_user and propagate the plan or feedback request
    this.publishStatus('waiting_for_user', 'INSTRUCTION', `[USER REVIEW REQUIRED]\n${subject}`);
    
    Logger.info('User action required. Please edit the Representative agent\'s current_status.md or provide a new instruction file, then change status to "Completed".');

    // 대표 에이전트 자신의 폴더에서 status가 'Completed'로 바뀌기를 대기 (유저가 기획서 확인 후 완료 처리)
    // Wait for the status in Representative's folder to become 'Completed' (User validates the plan and marks completed)
    try {
      // 10분 대기 예시 (필요시 무한대)
      // Wait up to 10 minutes (infinite if necessary)
      const result = await this.watcher.waitForStatus('current_status.md', ['Completed'], 600000); 
      Logger.agent(this.id, 'Received user validation.');
      
      // 사용자 피드백(혹은 에이전트 개입) 완료 시 기재한 토큰 사용량 정보가 있다면 로깅을 기록합니다.
      // If there is token usage information recorded by the host agent upon feedback completion, record the log.
      if (result.frontmatter && result.frontmatter.token_usage) {
        TokenLogger.logUsage(this.id, result.frontmatter.token_usage, this.workspaceDir);
      }

      return result.content;
    } catch (error) {
      Logger.error(`Timeout or error while waiting for user validation: ${error}`);
      return '';
    }
  }

  public cleanup(): void {
    this.watcher.close();
  }
}
