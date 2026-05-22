import { BaseAgent } from './base';
import { Logger } from '../utils/logger';
import { readMarkdownFile } from '../utils/markdown-helper';

export abstract class RunnerAgent extends BaseAgent {
  /**
   * 호스트 에이전트(IDE)에게 전달할 구체적인 프롬프트 지시문을 생성합니다.
   * 하위 클래스(Explorer, Writer 등)에서 오버라이드하여 각자의 페르소나에 맞는 프롬프트를 작성합니다.
   */
  protected abstract generatePrompt(instructionContent: string, toneGuidelines: string[]): string;

  /**
   * 실무 에이전트의 실행 로직. (호스트 에이전트 위임 방식)
   * 1. 이전 단계에서 온 지시서를 분석
   * 2. 호스트 AI를 위한 구체적 프롬프트 생성 후 상태를 'waiting_for_agent'로 퍼블리시
   * 3. 호스트 AI가 작업을 마치고 'Completed'로 상태를 바꿀 때까지 대기
   */
  public async execute(instructionPath?: string): Promise<void> {
    this.publishStatus('In Progress', 'STATUS_UPDATE', 'Preparing prompt for host agent...');
    
    let instructionContent = '';
    let toneGuidelines: string[] = [];

    // 전달받은 지시서가 있다면 읽기
    if (instructionPath) {
      try {
        const { frontmatter, content } = readMarkdownFile(instructionPath);
        instructionContent = content;
        toneGuidelines = frontmatter.tone_guidelines || [];
        Logger.agent(this.id, `Received instructions from previous step.`);
      } catch (e) {
        Logger.warn(`Failed to read instruction path: ${instructionPath}`);
      }
    }

    // 하위 클래스에서 정의한 프롬프트 템플릿 생성
    const hostPrompt = this.generatePrompt(instructionContent, toneGuidelines);

    // 호스트 에이전트 대기 상태로 진입
    Logger.agent(this.id, `Publishing instruction to host agent and waiting for completion...`);
    this.publishStatus('waiting_for_agent', 'INSTRUCTION', hostPrompt);

    try {
      // 무한 대기 (호스트 에이전트가 처리 후 Completed로 변경할 때까지)
      const result = await this.waitForHostAgentCompletion(0);
      
      Logger.agent(this.id, 'Task completed by host agent.');
      // 파이프라인 엔진이 읽어갈 수 있도록 최종 결과를 파일 시스템에 남겨둔 상태가 됨.
    } catch (error: any) {
      this.publishStatus('Failed', 'ERROR', `Error waiting for host agent: ${error.message}`);
      Logger.error(`[${this.id}] Task failed: ${error.message}`);
      throw error;
    }
  }
}
