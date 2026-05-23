import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Utility to manage unique temporary directories cleanly and safely.
 * 고유한 임시 디렉토리를 안전하고 깔끔하게 생성 및 관리하는 유틸리티입니다.
 */
export class TempHelper {
  private static readonly FALLBACK_TEMP_ROOT = path.join(process.cwd(), '.agent_workspace', 'temp');

  /**
   * Generates a unique temporary directory path, ensures its parent exists, and returns it.
   * 고유한 임시 디렉토리 경로를 생성하고, 부모 디렉토리가 존재하도록 보장한 후 반환합니다.
   * 
   * @param prefix 임시 디렉토리명 앞에 붙을 접두사 / Prefix for the temp directory name
   * @returns 생성된 고유 임시 디렉토리의 절대 경로 / Absolute path to the generated unique temp directory
   */
  public static createTempDir(prefix: string): string {
    const uniqueName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // 시스템 임시 디렉토리(os.tmpdir())를 최우선 사용하고, 실패/제한 시 로컬 .agent_workspace/temp로 폴백합니다.
    let tempRoot = os.tmpdir();
    
    // 만약 시스템 임시 디렉토리에 접근할 수 없거나 쓰기 권한이 없는 경우 폴백 처리
    try {
      fs.accessSync(tempRoot, fs.constants.W_OK);
    } catch (e) {
      tempRoot = this.FALLBACK_TEMP_ROOT;
    }

    const targetPath = path.join(tempRoot, uniqueName);
    
    // 디렉토리 생성
    fs.mkdirSync(targetPath, { recursive: true });
    
    return targetPath;
  }
}
