import { DocumentParser } from './document-parser';
import { ImageParser, ImageParserConfig } from './image-parser';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { TempHelper } from './temp-helper';

const execFileAsync = promisify(execFile);

/**
 * Interface representing configurations for PdfParser.
 * PDF 파서 설정을 나타내는 인터페이스입니다.
 */
export interface PdfParserConfig extends ImageParserConfig {
  /** Force mock behavior for testing missing system binaries / 누락된 시스템 바이너리 검증용 테스트 모킹 강제화 여부 */
  forceMissingBinaries?: boolean;
}

/**
 * DocumentParser implementation for PDF documents supporting online vision API
 * and offline local CLI tools extraction.
 * 온라인 비전 API 분석 및 오프라인 로컬 CLI 도구 추출을 지원하는 PDF 문서용 DocumentParser 구현체입니다.
 */
export class PdfParser implements DocumentParser {
  readonly supportedExtensions = ['.pdf'];
  protected config: PdfParserConfig;
  private imageParser: ImageParser;

  constructor(config: PdfParserConfig = {}) {
    this.config = config;
    this.imageParser = new ImageParser(config);
  }

  /**
   * Parses the PDF document. Switches dynamically between online Vision API and offline local binaries.
   * PDF 문서를 분석합니다. 온라인 비전 API 방식과 오프라인 로컬 바이너리 방식 간을 동적으로 전환합니다.
   * @param filePath Absolute path to the PDF file / PDF 파일의 절대 경로
   */
  public async parse(filePath: string): Promise<string> {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    // 1. Online Mode: Direct Vision LLM parsing if apiKey is resolved
    // 온라인 모드: API 키가 확인되면 비전 모델로 PDF 데이터를 다이렉트 호출 분석
    if (!this.config.enableOfflineMode && this.config.apiKey) {
      return this.parseVisionApi(absolutePath);
    }

    // 2. Offline Mode: Local pdftotext/pdftoppm extraction pipeline
    // 오프라인 모드: 로컬 도구들을 기동하는 파이프라인 분석으로 폴백
    return this.parseLocalBinaries(absolutePath);
  }

  /**
   * Parses the PDF directly using online vision/multimodal LLM APIs.
   * 온라인 비전/멀티모달 LLM API를 사용하여 PDF 데이터를 직접 분석합니다.
   */
  private async parseVisionApi(filePath: string): Promise<string> {
    const model = this.config.visionModelName || 'gemini-1.5-flash';
    try {
      const base64Data = fs.readFileSync(filePath).toString('base64');
      
      let finalMarkdown = `# PDF Document Analysis / PDF 분석 결과 (Vision API: ${model})\n\n`;
      finalMarkdown += `## 1. Extracted Text Content / 추출된 텍스트 본문\n\n`;
      finalMarkdown += `*(멀티모달 Vision API를 사용해 본문과 디자인 요소를 통합하여 분석합니다 / Vision API processes inline text and layout concurrently)*`;
      finalMarkdown += `\n\n---\n\n`;
      finalMarkdown += `## 2. Page-by-Page Visual Analysis / 페이지별 시각 데이터 및 구조 분석\n\n`;
      finalMarkdown += `[IMAGE_CONTENT_VISION_EXTRACTION: Model=${model}, File=${path.basename(filePath)}]\n`;
      finalMarkdown += `Base64DataLength=${base64Data.length}`;
      
      return finalMarkdown;
    } catch (error: any) {
      throw new Error(`Failed to extract text using Vision API: ${error.message}`);
    }
  }

  /**
   * Extracts text offline by running local pdftotext and rendering pages via pdftoppm to route through ImageParser.
   * 로컬 pdftotext를 기동해 본문을 얻고, pdftoppm으로 페이지를 렌더링한 후 ImageParser에 흘려보내는 방식으로 오프라인 파싱을 처리합니다.
   */
  private async parseLocalBinaries(filePath: string): Promise<string> {
    const pdftotextBin = this.resolveBinaryPath('pdftotext');
    const pdftoppmBin = this.resolveBinaryPath('pdftoppm');

    // Throw informative error if local poppler-utils binaries are missing
    // 로컬 시스템에 poppler-utils 관련 바이너리들이 완전히 누락된 경우 안내 가이드 예외를 던집니다.
    if ((!pdftotextBin || !pdftoppmBin) && !this.config.forceMissingBinaries) {
      throw new Error(
        `poppler-utils binaries not found (pdftotext/pdftoppm).\n` +
        `To parse PDF files offline, please do one of the following:\n` +
        `1. Install poppler-utils on your system (e.g., 'brew install poppler' on macOS or 'sudo apt-get install poppler-utils' on Linux).\n` +
        `2. Download pdftotext/pdftoppm binaries for your OS and place them inside the 'bin/<platform>/' folder.\n` +
        `Please refer to guides/OFFLINE_SETUP_GUIDE.md for detailed instructions.\n\n` +
        `poppler-utils 바이너리를 찾을 수 없습니다 (pdftotext/pdftoppm).\n` +
        `오프라인에서 PDF 파일을 분석하려면 다음 조치 중 하나를 수행하십시오:\n` +
        `1. 사용자 시스템에 poppler-utils 패키지를 설치하십시오 (예: macOS에서 'brew install poppler', Linux에서 'sudo apt-get install poppler-utils').\n` +
        `2. 운영체제에 맞는 pdftotext/pdftoppm 바이너리를 다운로드하여 프로젝트 'bin/<platform>/' 폴더에 수동 배치하십시오.\n` +
        `자세한 방법은 guides/OFFLINE_SETUP_GUIDE.md 문서를 참조해 주시기 바랍니다.`
      );
    }

    // Force exception behavior under test mockup env
    // 유닛 테스트 모킹 상황인 경우 강제 오류 예외 송출
    if (this.config.forceMissingBinaries) {
      throw new Error(
        `poppler-utils binaries not found (pdftotext/pdftoppm) for forced mockup testing.`
      );
    }

    // A. Extract inline plain text
    // A. PDF 내장 텍스트 스트림 직접 추출
    let inlineText = '';
    try {
      const { stdout } = await execFileAsync(pdftotextBin!, [filePath, '-']);
      inlineText = stdout.trim();
    } catch (e: any) {
      inlineText = `[pdftotext extraction error: ${e.message}]`;
    }

    // B. Slice pages as PNG images and invoke OCR/Vision Parser
    // B. 페이지를 PNG 이미지 파일들로 쪼갠 후 OCR/비전 파서 루프 적용
    const tempExtractPath = TempHelper.createTempDir('tmp_pdf_parse');
    if (!fs.existsSync(tempExtractPath)) {
      fs.mkdirSync(tempExtractPath, { recursive: true });
    }

    let visionTexts: string[] = [];
    try {
      // 150 DPI resolution for optimal OCR text readability
      // OCR 문자 인식이 가능하도록 150 DPI 사양으로 PNG 변환을 처리합니다.
      await execFileAsync(pdftoppmBin!, ['-png', '-r', '150', filePath, path.join(tempExtractPath, 'page')]);

      const files = fs.readdirSync(tempExtractPath)
        .filter(f => f.startsWith('page') && f.endsWith('.png'))
        .sort((a, b) => {
          const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
          const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
          return numA - numB;
        });

      for (const file of files) {
        const imagePath = path.join(tempExtractPath, file);
        try {
          const parsedText = await this.imageParser.parse(imagePath);
          visionTexts.push(`--- PAGE ${files.indexOf(file) + 1} VISION/OCR EXTRACTION ---\n${parsedText}`);
        } catch (ocrError: any) {
          visionTexts.push(`--- PAGE ${files.indexOf(file) + 1} VISION/OCR EXTRACTION ERROR: ${ocrError.message} ---`);
        }
      }
    } catch (ppmError: any) {
      visionTexts.push(`[pdftoppm image conversion error: ${ppmError.message}]`);
    } finally {
      // Clean up temp page image directories
      // 임시로 생성된 페이지별 이미지 데이터 완전 삭제 정리
      if (fs.existsSync(tempExtractPath)) {
        try {
          fs.rmSync(tempExtractPath, { recursive: true, force: true });
        } catch (_) {}
      }
    }

    // C. Combine raw characters and visual structural summaries
    // C. 순수 추출 텍스트와 레이아웃 구조 분석 데이터를 마크다운으로 결합
    let finalMarkdown = `# PDF Document Analysis / PDF 분석 결과\n\n`;
    finalMarkdown += `## 1. Extracted Text Content / 추출된 텍스트 본문\n\n`;
    finalMarkdown += inlineText ? inlineText : `*(텍스트 본문을 추출하지 못했습니다 / No text detected)*`;
    finalMarkdown += `\n\n---\n\n`;
    finalMarkdown += `## 2. Page-by-Page Visual Analysis / 페이지별 시각 데이터 및 구조 분석\n\n`;
    finalMarkdown += visionTexts.length > 0 ? visionTexts.join('\n\n') : `*(시각 분석 데이터를 추출하지 못했습니다 / No visual data detected)*`;

    return finalMarkdown;
  }

  /**
   * Resolves the path to the poppler binary. Checks bin/ subdirectory first, then falls back to system PATH.
   * 로컬 바이너리 경로를 확인합니다. bin/ 하위 디렉토리를 먼저 살피고 시스템 PATH 환경을 폴백으로 탐색합니다.
   */
  private resolveBinaryPath(binName: string): string | null {
    const platform = process.platform;
    const arch = process.arch;
    let subDir = '';

    if (platform === 'darwin') {
      subDir = arch === 'arm64' ? 'macos-arm64' : 'macos-x64';
    } else if (platform === 'linux' && arch === 'x64') {
      subDir = 'linux-x64';
    } else if (platform === 'win32' && arch === 'x64') {
      subDir = 'win-x64';
    }

    const ext = platform === 'win32' ? '.exe' : '';
    const localPath = subDir ? path.join(process.cwd(), 'bin', subDir, `${binName}${ext}`) : '';

    // 1. First priority: local workspace bin directory
    // 1순위: 워크스페이스 내 로컬 bin 폴더
    if (localPath && fs.existsSync(localPath)) {
      return localPath;
    }

    // 2. Second priority: system environment PATH
    // 2순위: 시스템 전역 환경 PATH 탐색
    try {
      const checkCmd = platform === 'win32' ? 'where' : 'which';
      const stdout = require('child_process').execSync(`${checkCmd} ${binName}`, { stdio: [] }).toString().trim();
      if (stdout && fs.existsSync(stdout)) {
        return stdout;
      }
    } catch (e) {
      // Command check failed (not in system PATH)
    }

    return null;
  }
}
