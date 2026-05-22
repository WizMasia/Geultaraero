import * as fs from 'fs';
import * as path from 'path';
import { AgentMessageFrontmatter, writeMarkdownFile, readMarkdownFile, ParsedMarkdown } from '../utils/markdown-helper';
import { FileWatcher } from '../utils/file-watcher';
import { Logger } from '../utils/logger';
import { TokenLogger } from '../utils/token-logger';

export abstract class BaseAgent {
  public id: string;
  public role: string;
  public persona: string;
  protected workspaceDir: string;
  protected agentDir: string;

  constructor(id: string, role: string, persona: string, workspaceDir: string) {
    this.id = id;
    this.role = role;
    this.persona = persona;
    this.workspaceDir = workspaceDir;
    this.agentDir = path.join(workspaceDir, id);
    this.initializeDirectory();
  }

  private initializeDirectory(): void {
    if (!fs.existsSync(this.agentDir)) {
      fs.mkdirSync(this.agentDir, { recursive: true });
    }
  }

  /**
   * 자신의 현재 상태를 마크다운 파일로 워크스페이스에 발행합니다.
   */
  protected publishStatus(
    status: AgentMessageFrontmatter['status'],
    messageType: AgentMessageFrontmatter['message_type'],
    content: string,
    additionalFrontmatter: Partial<AgentMessageFrontmatter> = {}
  ): void {
    const timestamp = new Date().toISOString();
    const frontmatter: AgentMessageFrontmatter = {
      sender: this.id,
      timestamp,
      message_type: messageType,
      status,
      ...additionalFrontmatter
    };

    const filePath = path.join(this.agentDir, 'current_status.md');
    writeMarkdownFile(filePath, frontmatter, content);
    Logger.agent(this.id, `Status updated to [${status}] (${messageType})`);
  }

  /**
   * 다른 에이전트에게 지시나 메시지를 직접 전송합니다.
   */
  public sendMessage(
    receiverId: string,
    messageType: AgentMessageFrontmatter['message_type'],
    content: string,
    additionalFrontmatter: Partial<AgentMessageFrontmatter> = {}
  ): void {
    const timestamp = new Date().toISOString();
    const frontmatter: AgentMessageFrontmatter = {
      sender: this.id,
      receiver: receiverId,
      timestamp,
      message_type: messageType,
      status: 'Pending',
      ...additionalFrontmatter
    };

    const receiverDir = path.join(this.workspaceDir, receiverId);
    if (!fs.existsSync(receiverDir)) {
      fs.mkdirSync(receiverDir, { recursive: true });
    }
    const fileName = `msg_${this.id}_${Date.now()}.md`;
    writeMarkdownFile(path.join(receiverDir, fileName), frontmatter, content);
    Logger.agent(this.id, `Sent ${messageType} to ${receiverId}`);
  }

  /**
   * 상태 파일이 'Completed'가 될 때까지 무기한(또는 지정된 시간) 대기합니다.
   * 호스트 에이전트(IDE)가 작업을 완료하고 상태를 갱신할 때까지 기다립니다.
   */
  protected async waitForHostAgentCompletion(timeoutMs: number = 0): Promise<ParsedMarkdown> {
    const watcher = new FileWatcher(this.workspaceDir);
    try {
      const result = await watcher.waitForStatus('current_status.md', ['Completed'], timeoutMs);
      
      // 호스트 에이전트가 완료 시 기재한 토큰 사용량 정보가 있다면 로깅을 기록합니다.
      // If there is token usage information recorded by the host agent upon completion, record the log.
      if (result.frontmatter && result.frontmatter.token_usage) {
        TokenLogger.logUsage(this.id, result.frontmatter.token_usage, this.workspaceDir);
      }

      return result;
    } finally {
      watcher.close();
    }
  }

  /**
   * 에이전트의 메인 실행 로직 (하위 클래스에서 구현)
   */
  public abstract execute(instructionPath?: string): Promise<void>;
}
