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

  it('should be registered to ParserFactory and support .pdf / ParserFactory에 성공적으로 등록되고 .pdf를 처리해야 함', () => {
    const parser = ParserFactory.getParser('dummy.pdf');
    expect(parser).toBeDefined();
    expect(parser).toBeInstanceOf(PdfParser);
    expect(parser.supportedExtensions).toContain('.pdf');
  });
});
