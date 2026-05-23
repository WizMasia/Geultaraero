import { DocumentParser } from './document-parser';
import * as path from 'path';
import * as fs from 'fs';

/**
 * DocumentParser implementation for PDF documents.
 * PDF 문서를 처리하기 위한 DocumentParser 구현체입니다.
 */
export class PdfParser implements DocumentParser {
  readonly supportedExtensions = ['.pdf'];

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
    return "pdf content skeleton";
  }
}
