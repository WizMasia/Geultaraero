import { DocumentParser } from './document-parser';
import { ImageParserConfig } from './image-parser';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Interface representing configurations for PdfParser.
 * PDF 파서 설정을 나타내는 인터페이스입니다.
 */
export interface PdfParserConfig extends ImageParserConfig {
  /** Force mock behavior for testing missing system binaries / 누락된 시스템 바이너리 검증용 테스트 모킹 강제화 여부 */
  forceMissingBinaries?: boolean;
}

/**
 * DocumentParser implementation for PDF documents.
 * PDF 문서를 처리하기 위한 DocumentParser 구현체입니다.
 */
export class PdfParser implements DocumentParser {
  readonly supportedExtensions = ['.pdf'];
  protected config: PdfParserConfig;

  constructor(config: PdfParserConfig = {}) {
    this.config = config;
  }

  /**
   * Parses the PDF document. (Skeleton implementation)
   * PDF 문서를 분석합니다. (스켈레톤 구현체)
   * @param filePath Absolute path to the PDF file / PDF 파일의 절대 경로
   */
  public async parse(filePath: string): Promise<string> {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    // Throw simulated error if missing system binaries option is forced for test mockup
    // 누락된 시스템 바이너리 오류를 검증하기 위해 강제 모킹이 설정된 경우 예외를 발생시킵니다.
    if (this.config.enableOfflineMode && this.config.forceMissingBinaries) {
      throw new Error(
        `poppler-utils binaries not found (pdftotext/pdftoppm).\n` +
        `To parse PDF files offline, please install poppler-utils on your system or place binaries inside the 'bin/' folder.`
      );
    }

    return "pdf content skeleton";
  }
}
