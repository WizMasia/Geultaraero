import { PdfParser } from '../pdf-parser';
import { ParserFactory } from '../document-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('PdfParser tests / PDF 파서 테스트', () => {
  let samplePdfPath: string;

  beforeAll(() => {
    // Create a dummy file path (the CLI execution will fail, but we check basic mock configuration first)
    // 테스트용 더미 파일 경로를 생성합니다.
    samplePdfPath = path.join(__dirname, 'dummy_test.pdf');
    fs.writeFileSync(samplePdfPath, '%PDF-1.4 dummy content');
    ParserFactory.registerParser(new PdfParser());
  });

  afterAll(() => {
    if (fs.existsSync(samplePdfPath)) {
      fs.unlinkSync(samplePdfPath);
    }
  });

  it('should throw an error if file does not exist / 파일이 없을 경우 에러를 던져야 함', async () => {
    const parser = new PdfParser();
    await expect(parser.parse('non_existent.pdf')).rejects.toThrow('File not found');
  });

  it('should fall back to descriptive guide error if binaries are missing in offline mode / 오프라인 모드에서 바이너리 누락 시 친절한 설명형 가이드 예외를 던져야 함', async () => {
    // Force offline mode and simulate missing binary by providing mock config
    // 오프라인 모드를 강제하고 바이너리가 없는 상황을 시뮬레이션하는 설정을 주입합니다.
    const parser = new PdfParser({ enableOfflineMode: true, forceMissingBinaries: true });
    await expect(parser.parse(samplePdfPath)).rejects.toThrow('poppler-utils binaries not found');
  });

  it('should be registered to ParserFactory and support .pdf / ParserFactory에 성공적으로 등록되고 .pdf를 처리해야 함', () => {
    const parser = ParserFactory.getParser('dummy.pdf');
    expect(parser).toBeDefined();
    expect(parser).toBeInstanceOf(PdfParser);
    expect(parser.supportedExtensions).toContain('.pdf');
  });
});
