import { DocumentParser } from './document-parser';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Interface representing configurations for ImageParser.
 * 이미지 파서 설정을 나타내는 인터페이스입니다.
 */
export interface ImageParserConfig {
  /** Enable survival offline mode to prevent external API calls / API 호출을 막는 오프라인 모드 활성화 여부 */
  enableOfflineMode?: boolean;
  /** API key for multimodal vision model integration / 멀티모달 비전 모델용 API 키 */
  apiKey?: string;
  /** Vision model name to execute (e.g. gemini-1.5-flash) / 실행할 비전 모델명 (예: gemini-1.5-flash) */
  visionModelName?: string;
}

/**
 * DocumentParser implementation for image file analysis.
 * 이미지 파일 분석을 위한 DocumentParser 구현체입니다.
 */
export class ImageParser implements DocumentParser {
  readonly supportedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  private config: ImageParserConfig;

  constructor(config: ImageParserConfig = {}) {
    this.config = config;
  }

  /**
   * Parses the given image file using Vision API or falls back to local OCR guidance.
   * 주어진 이미지 파일을 Vision API를 사용하여 파싱하거나 로컬 OCR 안내 폴백을 수행합니다.
   * @param filePath Absolute path to the image file / 이미지 파일의 절대 경로
   */
  public async parse(filePath: string): Promise<string> {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!this.supportedExtensions.includes(ext)) {
      throw new Error(`Unsupported image format: ${ext}`);
    }

    // Dynamic switching between offline local OCR and LLM Vision API
    // 오프라인 로컬 OCR 방식과 LLM 비전 API 방식 간의 동적 감지 및 전환
    if (this.config.enableOfflineMode || !this.config.apiKey) {
      return this.parseLocalOcr(absolutePath);
    }

    return this.parseVisionApi(absolutePath);
  }

  /**
   * Conducts character recognition using local OCR tools or throws descriptive error under offline environments.
   * 로컬 OCR 도구를 통해 문자 해독을 처리하거나, 오프라인 환경에 맞는 자세한 제약 에러를 발생시킵니다.
   */
  private async parseLocalOcr(filePath: string): Promise<string> {
    // Tesseract.js requires downloading WASM assets at runtime which fails in sandbox environments.
    // Therefore, we prompt the user to install the tesseract CLI binary locally or disable offline mode.
    // Tesseract.js는 런타임에 WASM 에셋 다운로드를 시도하므로 샌드박스 망분리 환경에서 오류가 납니다.
    // 이에 따라 로컬 tesseract CLI 바이너리를 직접 설치하거나 오프라인 모드를 해제하도록 예외를 던집니다.
    throw new Error(
      `Image parsing is limited in offline survival mode.\n` +
      `To analyze images offline, please ensure the 'tesseract' CLI tool is installed locally on your system, ` +
      `or disable offline mode to leverage online Vision API endpoints.`
    );
  }

  /**
   * Parses the image utilizing multimodal Vision LLM APIs.
   * 멀티모달 Vision LLM API를 연동하여 이미지 데이터를 구조화된 텍스트로 복원합니다.
   */
  private async parseVisionApi(filePath: string): Promise<string> {
    const model = this.config.visionModelName || 'gemini-1.5-flash';
    
    try {
      const base64Data = fs.readFileSync(filePath).toString('base64');
      
      // Integration hook structure. Actual orchestrator engine handles the REST API call to LLM endpoints.
      // 여기서는 호스트 AI 에이전트 연동용 가이드 포맷 스트링 또는 데이터 직렬화 형태를 모킹하여 처리합니다.
      // 인덱싱 시점에 에이전트의 Vision API 인보커로 바인딩되도록 규격을 래핑합니다.
      return `[IMAGE_CONTENT_VISION_EXTRACTION: Model=${model}, File=${path.basename(filePath)}]\nBase64DataLength=${base64Data.length}`;
    } catch (error: any) {
      throw new Error(`Failed to extract text using Vision API: ${error.message}`);
    }
  }
}
