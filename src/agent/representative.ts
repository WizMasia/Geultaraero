import { BaseAgent } from './base';
import { FileWatcher } from '../utils/file-watcher';
import { Logger } from '../utils/logger';
import * as path from 'path';

export class RepresentativeAgent extends BaseAgent {
  private watcher: FileWatcher;

  constructor(id: string, persona: string, workspaceDir: string) {
    super(id, 'representative', persona, workspaceDir);
    this.watcher = new FileWatcher(workspaceDir);
  }

  /**
   * 대표 에이전트는 유저의 입력을 대기하거나, 다른 에이전트에게 지시를 내리는 역할을 합니다.
   */
  public async execute(): Promise<void> {
    Logger.agent(this.id, 'Representative Agent is now active.');
    // 기본 구현은 워크플로우 엔진에서 호출되며, 특정 시점에 개입.
  }

  /**
   * 사용자 피드백 대기 및 개입 로직
   * @param subject 검토 대상 문서 경로 또는 내용 요약
   * @returns 사용자의 피드백 텍스트
   */
  public async waitForUserFeedback(subject: string): Promise<string> {
    Logger.agent(this.id, `Requesting user feedback for: ${subject}`);
    
    // 상태를 waiting_for_user로 변경
    this.publishStatus('waiting_for_user', 'INSTRUCTION', `[USER REVIEW REQUIRED]\n${subject}`);
    
    Logger.info('User action required. Please edit the Representative agent\'s current_status.md or provide a new instruction file, then change status to "Completed".');

    // 대표 에이전트 자신의 폴더에서 status가 'Completed'로 바뀌기를 대기 (유저가 IDE에서 파일 수정 후 저장)
    try {
      // 10분 대기 예시 (필요시 무한대)
      const result = await this.watcher.waitForStatus('current_status.md', ['Completed'], 600000); 
      Logger.agent(this.id, 'Received user feedback.');
      return result.content;
    } catch (error) {
      Logger.error(`Timeout or error while waiting for user: ${error}`);
      return '';
    }
  }

  public cleanup(): void {
    this.watcher.close();
  }
}
