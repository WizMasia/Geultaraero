import * as chokidar from 'chokidar';
import * as path from 'path';
import { readMarkdownFile, AgentMessageFrontmatter } from './markdown-helper';

/**
 * 특정 워크스페이스 내의 파일 변경을 감지하고 상태 변경을 추적하는 클래스입니다.
 */
export class FileWatcher {
  private watcher: chokidar.FSWatcher;
  private watchDir: string;

  constructor(workspaceDir: string) {
    this.watchDir = workspaceDir;
    
    // 워크스페이스 내의 모든 마크다운 파일을 감시 (초기화시 파일 읽지 않음)
    this.watcher = chokidar.watch(path.join(workspaceDir, '**/*.md'), {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500, // 파일 쓰기가 끝났다고 판단할 시간 (0.5초)
        pollInterval: 100
      }
    });
  }

  /**
   * 특정 조건(예: 파일 상태가 'Completed' 또는 'waiting_for_user')을 만족하는 파일이 나타날 때까지 대기합니다.
   * @param targetFileName 기다리는 대상 파일 이름 (예: 'current_status.md')
   * @param expectedStatus 기다리는 프론트매터의 상태값
   * @param timeoutMs 최대 대기 시간 (기본값: 무한대, 구현상 10분 등 설정 가능)
   */
  public waitForStatus(
    targetFileName: string,
    expectedStatus: AgentMessageFrontmatter['status'][],
    timeoutMs: number = 0
  ): Promise<{ filePath: string; frontmatter: AgentMessageFrontmatter; content: string }> {
    return new Promise((resolve, reject) => {
      let timeoutHandle: NodeJS.Timeout;

      const checkFile = (filePath: string) => {
        // 관심 있는 파일 이름인지 확인
        if (path.basename(filePath) !== targetFileName) return;

        try {
          const { frontmatter, content } = readMarkdownFile(filePath);
          if (expectedStatus.includes(frontmatter.status)) {
            // 조건 충족 시 감시 해제 및 resolve
            cleanup();
            resolve({ filePath, frontmatter, content });
          }
        } catch (error) {
          // 파싱 에러(쓰는 중일 때 등)는 무시하고 다음 이벤트를 기다림
        }
      };

      const onChange = (filePath: string) => checkFile(filePath);
      const onAdd = (filePath: string) => checkFile(filePath);

      this.watcher.on('change', onChange);
      this.watcher.on('add', onAdd);

      const cleanup = () => {
        this.watcher.off('change', onChange);
        this.watcher.off('add', onAdd);
        if (timeoutHandle) clearTimeout(timeoutHandle);
      };

      if (timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
          cleanup();
          reject(new Error(`Timeout waiting for ${targetFileName} to reach status: ${expectedStatus.join(' or ')}`));
        }, timeoutMs);
      }
    });
  }

  /**
   * 워크스페이스 감시를 종료합니다.
   */
  public close(): void {
    this.watcher.close();
  }
}
