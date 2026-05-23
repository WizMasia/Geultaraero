import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

/**
 * Utility to resolve external helper binaries safely and dynamically across multiple search locations.
 * 다양한 환경에서 외부 동반 바이너리들의 실행 경로를 동적 및 안전하게 리졸브해주는 공통 유틸리티 클래스입니다.
 */
export class BinaryResolver {
  /**
   * Resolves the appropriate platform/architecture subdirectory name.
   * OS 및 아키텍처 사양에 매칭되는 서브 디렉토리 이름을 반환합니다.
   */
  public static getSubDir(): string {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === 'darwin') {
      return arch === 'arm64' ? 'macos-arm64' : 'macos-x64';
    } else if (platform === 'linux' && arch === 'x64') {
      return 'linux-x64';
    } else if (platform === 'win32' && arch === 'x64') {
      return 'win-x64';
    }
    
    // Fallback or throw error if platform is unsupported
    throw new Error(`Unsupported platform/architecture: ${platform}/${arch}`);
  }

  /**
   * Resolves the absolute path for the given binary name by scanning process executor, workspace, and system PATH.
   * 실행 파일의 동반 폴더, 현재 작업 디렉토리(CWD) 및 시스템 PATH를 다각도로 조사하여 대상 바이너리의 최종 경로를 리졸브합니다.
   * 
   * @param binName 바이너리 파일명 (확장자 제외, 예: 'rhwp', 'pdftotext')
   * @returns 바이너리의 유효한 절대 경로 또는 시스템 전역 호출 이름, 찾지 못한 경우 null 반환
   */
  public static resolve(binName: string): string | null {
    const platform = process.platform;
    let subDir = '';
    
    try {
      subDir = this.getSubDir();
    } catch (e) {
      // If unsupported platform, fallback to search system PATH only
    }

    const ext = platform === 'win32' ? '.exe' : '';
    const fullBinName = `${binName}${ext}`;

    // 1순위: pkg 빌드 등으로 패키징된 실행 파일이 위치한 실제 폴더 바로 밑의 bin 서브 디렉토리 조사
    // e.g. path/to/glro/bin/macos-arm64/rhwp
    const execDir = path.dirname(process.execPath);
    if (subDir) {
      const execSubPath = path.join(execDir, 'bin', subDir, fullBinName);
      if (fs.existsSync(execSubPath)) {
        return execSubPath;
      }
    }

    // 2순위: pkg 실행 파일과 완전히 동일한 폴더 내부에 바로 배치된 형태 조사
    // e.g. path/to/glro/rhwp
    const execDirectPath = path.join(execDir, fullBinName);
    if (fs.existsSync(execDirectPath)) {
      return execDirectPath;
    }

    // 3순위: 현재 Node 프로세스의 작업 디렉토리(CWD) 기준 로컬 bin 디렉토리 조사
    // e.g. ./bin/macos-arm64/rhwp
    if (subDir) {
      const cwdSubPath = path.join(process.cwd(), 'bin', subDir, fullBinName);
      if (fs.existsSync(cwdSubPath)) {
        return cwdSubPath;
      }
    }

    // 4순위: 시스템 환경변수 PATH 상에 등록되어 있는 전역 명령어 확인
    try {
      const checkCmd = platform === 'win32' ? 'where' : 'which';
      const stdout = execSync(`${checkCmd} ${binName}`, { stdio: [] }).toString().trim();
      // 여러 라인이 반환될 수 있으므로 첫 라인 사용
      const firstLine = stdout.split('\n')[0]?.trim();
      if (firstLine && fs.existsSync(firstLine)) {
        return firstLine;
      }
    } catch (e) {
      // Command check failed (not in system PATH)
    }

    return null;
  }
}
