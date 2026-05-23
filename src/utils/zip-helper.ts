import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Zips a directory contents to a destination zip path using system tar command.
 * 시스템 tar 명령어를 사용하여 디렉토리 내용을 지정한 zip 경로로 압축합니다.
 * @param sourceDir 디렉토리 원본 경로 / Source directory path
 * @param destZipPath 생성될 zip 파일 경로 / Destination zip file path
 */
export async function zip(sourceDir: string, destZipPath: string): Promise<void> {
  const absoluteSource = path.resolve(sourceDir);
  const absoluteDest = path.resolve(destZipPath);

  if (!fs.existsSync(absoluteSource)) {
    throw new Error(`Source directory does not exist: ${absoluteSource}`);
  }

  // Ensure destination parent directory exists
  // 대상 파일의 부모 디렉토리가 존재하는지 확인하고 생성합니다.
  const destParent = path.dirname(absoluteDest);
  if (!fs.existsSync(destParent)) {
    fs.mkdirSync(destParent, { recursive: true });
  }

  try {
    // Use system tar with --format zip for cross-platform compatibility
    // 크로스 플랫폼 호환성을 위해 --format zip 옵션과 함께 시스템 tar를 실행합니다.
    await execFileAsync('tar', ['-cf', absoluteDest, '--format', 'zip', '-C', absoluteSource, '.']);
  } catch (error: any) {
    throw new Error(`Failed to zip directory using tar: ${error.message}`);
  }
}

/**
 * Unzips a zip file to a destination directory using system tar command.
 * 시스템 tar 명령어를 사용하여 zip 파일을 지정한 디렉토리로 압축 해제합니다.
 * @param zipPath zip 파일 경로 / Zip file path
 * @param destDir 해제할 디렉토리 경로 / Destination directory path
 */
export async function unzip(zipPath: string, destDir: string): Promise<void> {
  const absoluteZip = path.resolve(zipPath);
  const absoluteDest = path.resolve(destDir);

  if (!fs.existsSync(absoluteZip)) {
    throw new Error(`Zip file does not exist: ${absoluteZip}`);
  }

  if (!fs.existsSync(absoluteDest)) {
    fs.mkdirSync(absoluteDest, { recursive: true });
  }

  try {
    // Extract zip contents using tar
    // tar 명령어를 사용해 zip 파일 압축을 해제합니다.
    await execFileAsync('tar', ['-xf', absoluteZip, '-C', absoluteDest]);
  } catch (error: any) {
    throw new Error(`Failed to unzip file using tar: ${error.message}`);
  }
}
