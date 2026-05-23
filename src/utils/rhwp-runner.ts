import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { BinaryResolver } from './binary-resolver';

const execFileAsync = promisify(execFile);

/**
 * Resolves the path to the rhwp binary based on the current platform and architecture.
 * 현재 OS 및 아키텍처에 근거하여 rhwp 바이너리의 로컬 실행 경로를 반환합니다.
 */
export function getRhwpBinaryPath(): string {
  const resolved = BinaryResolver.resolve('rhwp');
  if (resolved) {
    return resolved;
  }

  // Fallback for backwards compatibility and detailed error path reporting
  const platform = process.platform;
  const ext = platform === 'win32' ? '.exe' : '';
  let subDir = 'macos-arm64';
  try {
    subDir = BinaryResolver.getSubDir();
  } catch (e) {}

  return path.join(process.cwd(), 'bin', subDir, `rhwp${ext}`);
}

/**
 * Executes a command on the local rhwp binary with the specified arguments.
 * 지정된 인수를 바탕으로 로컬 rhwp 바이너리 명령어를 실행하고 결과를 반환합니다.
 * @param args Command-line arguments for rhwp / rhwp용 명령행 인수 리스트
 */
export async function runRhwpCommand(args: string[]): Promise<string> {
  const binPath = getRhwpBinaryPath();
  if (!fs.existsSync(binPath)) {
    // Provide clean installation guidance error if the binary is missing (e.g., offline environments)
    // 바이너리가 없는 경우 (예: 오프라인 환경), 수동 다운로드 및 배치 경로 안내를 발생시킵니다.
    throw new Error(
      `rhwp binary not found at ${binPath}.\nPlease download the binary for your platform and place it in the correct folder.\nDownload from: https://github.com/edwardkim/rhwp/releases`
    );
  }

  try {
    const { stdout } = await execFileAsync(binPath, args);
    return stdout;
  } catch (error: any) {
    throw new Error(`rhwp execution failed: ${error.message}`);
  }
}
