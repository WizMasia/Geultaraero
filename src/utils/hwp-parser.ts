import * as fs from 'fs';
import * as path from 'path';
import { runRhwpCommand } from './rhwp-runner';
import { unzip } from './zip-helper';
import { DocumentParser } from './document-parser';

/**
 * Parses an HWP file using rhwp CLI.
 * rhwp CLI를 사용해 HWP 파일을 파싱합니다.
 * @param filePath HWP 파일 경로 / Path to HWP file
 * @returns 파싱된 텍스트 내용 / Parsed text content
 */
export async function parseHwp(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  try {
    const dump = await runRhwpCommand(['dump', absolutePath]);
    return cleanHwpDump(dump);
  } catch (error: any) {
    throw new Error(`Failed to parse HWP via rhwp: ${error.message}`);
  }
}

/**
 * Parses an HWPX file by extracting and reading section0.xml, falling back to rhwp CLI.
 * HWPX 파일을 압축 해제하여 section0.xml을 파싱하고, 실패 시 rhwp CLI로 폴백합니다.
 * @param filePath HWPX 파일 경로 / Path to HWPX file
 * @returns 파싱된 텍스트 내용 / Parsed text content
 */
export async function parseHwpx(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  // Define unique temp directory within the workspace
  // 워크스페이스 내에 고유한 임시 디렉토리를 정의합니다.
  const tempDirName = `tmp_hwpx_parse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const tempExtractPath = path.join(process.cwd(), '.agent_workspace', 'temp', tempDirName);

  try {
    // Attempt local unzip and XML parsing
    // 로컬 압축 해제 및 XML 파싱을 시도합니다.
    await unzip(absolutePath, tempExtractPath);
    
    // HWPX documents hold section content in Contents/section[0-9]+.xml
    // HWPX 문서는 Contents/section[0-9]+.xml에 본문 내용을 보관합니다.
    const contentsDir = path.join(tempExtractPath, 'Contents');
    if (!fs.existsSync(contentsDir)) {
      throw new Error(`Contents directory not found in HWPX structure`);
    }

    const files = fs.readdirSync(contentsDir);
    const sectionFiles = files
      .filter(f => f.startsWith('section') && f.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
        return numA - numB;
      });

    if (sectionFiles.length === 0) {
      throw new Error(`No section XML files found in HWPX Contents`);
    }

    const textContents: string[] = [];
    for (const secFile of sectionFiles) {
      const xmlPath = path.join(contentsDir, secFile);
      const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
      textContents.push(extractTextFromXml(xmlContent));
    }

    return textContents.join('\n\n');
  } catch (localError: any) {
    // Fallback to rhwp CLI if manual unzip fails
    // 로컬 압축 해제가 실패할 경우 rhwp CLI로 폴백합니다.
    try {
      const dump = await runRhwpCommand(['dump', absolutePath]);
      return cleanHwpDump(dump);
    } catch (cliError: any) {
      throw new Error(
        `Failed to parse HWPX (Local: ${localError.message}, CLI: ${cliError.message})`
      );
    }
  } finally {
    // Cleanup temporary directory
    // 임시 디렉토리를 정리합니다.
    if (fs.existsSync(tempExtractPath)) {
      try {
        fs.rmSync(tempExtractPath, { recursive: true, force: true });
      } catch (cleanupError) {
        // Suppress cleanup error to not fail parsing
      }
    }
  }
}

/**
 * Extracts plain text from the rhwp CLI dump output.
 * rhwp CLI 덤프 출력에서 플레인 텍스트를 추출합니다.
 */
function cleanHwpDump(dump: string): string {
  const lines = dump.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    // Match text nodes in the CLI IR dump format (e.g., text: "value")
    // CLI IR 덤프 형식의 텍스트 노드를 매칭합니다 (예: text: "값")
    const textMatch = line.match(/text:\s*"(.*)"/);
    if (textMatch && textMatch[1]) {
      // Decode escaped quotes
      const cleanedText = textMatch[1]
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
      result.push(cleanedText);
    }
  }

  return result.join('\n\n');
}

/**
 * Extracts text cleanly from HWPX paragraph XML.
 * HWPX 문단 XML에서 텍스트를 깔끔하게 추출합니다.
 */
function extractTextFromXml(xml: string): string {
  // Replace paragraph block tags with newlines
  // 문단 블록 태그를 개행 문자로 치환합니다.
  let cleaned = xml.replace(/<hp:p[^>]*>/g, '\n');
  
  // Strip all other XML tags
  // 나머지 모든 XML 태그를 제거합니다.
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Decode standard XML entities
  // 표준 XML 엔티티를 디코딩합니다.
  cleaned = cleaned.replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&amp;/g, '&')
                   .replace(/&quot;/g, '"')
                   .replace(/&apos;/g, "'");

  return cleaned
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n\n');
}

/**
 * DocumentParser implementation for HWP and HWPX files.
 * HWP 및 HWPX 파일을 위한 DocumentParser 구현체입니다.
 */
export class HwpParser implements DocumentParser {
  readonly supportedExtensions = ['.hwp', '.hwpx'];

  public async parse(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.hwp') {
      return parseHwp(filePath);
    } else if (ext === '.hwpx') {
      return parseHwpx(filePath);
    }
    throw new Error(`Unsupported extension for HwpParser: ${ext}`);
  }
}

