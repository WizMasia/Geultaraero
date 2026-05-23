import * as path from 'path';

/**
 * Common interface for all document parsers.
 * 모든 문서 파서의 공통 인터페이스입니다.
 */
export interface DocumentParser {
  /**
   * List of supported file extensions (e.g. ['.hwp', '.hwpx'])
   * 지원하는 파일 확장자 목록 (예: ['.hwp', '.hwpx'])
   */
  readonly supportedExtensions: string[];

  /**
   * Parses the given document file and returns its content in standard markdown text format.
   * 주어진 문서 파일을 파싱하고 그 본문 내용을 표준 마크다운 텍스트 형식으로 반환합니다.
   * @param filePath Absolute path to the document file / 문서 파일의 절대 경로
   */
  parse(filePath: string): Promise<string>;
}

/**
 * Registry and factory manager that coordinates document parsing based on file format.
 * 파일 형식에 기반하여 문서 파싱을 조율하는 레지스트리 및 팩토리 매니저입니다.
 */
export class ParserFactory {
  private static parsers: DocumentParser[] = [];

  /**
   * Registers a new document parser implementation.
   * 새로운 문서 파서 구현체를 팩토리에 등록합니다.
   * @param parser The DocumentParser instance to register / 등록할 DocumentParser 인스턴스
   */
  public static registerParser(parser: DocumentParser): void {
    this.parsers.push(parser);
  }

  /**
   * Retrieves the appropriate parser registered for the given file extension.
   * 주어진 파일 확장자에 대해 등록된 적합한 파서를 찾아 반환합니다.
   * @param filePath Path or filename / 파일 경로 또는 파일명
   */
  public static getParser(filePath: string): DocumentParser {
    const ext = path.extname(filePath).toLowerCase();
    const parser = this.parsers.find(p => p.supportedExtensions.includes(ext));
    if (!parser) {
      throw new Error(`Unsupported file format: ${ext}`);
    }
    return parser;
  }

  /**
   * Convenience method to parse a document directly using the registered parser matching the file format.
   * 파일 형식에 매칭되는 등록된 파서를 사용해 문서를 즉시 파싱하는 편의용 대행 메서드입니다.
   * @param filePath Absolute path to the document file / 문서 파일의 절대 경로
   */
  public static async parseDocument(filePath: string): Promise<string> {
    const parser = this.getParser(filePath);
    return parser.parse(filePath);
  }
}
