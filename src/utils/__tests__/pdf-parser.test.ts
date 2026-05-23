import { PdfParser } from '../pdf-parser';
import { ParserFactory } from '../document-parser';
import * as fs from 'fs';
import * as path from 'path';

// Mock child_process to avoid sandbox filesystem block and run unified pipelines safely
// 샌드박스 파일시스템 충돌을 피하고 온/오프라인 파이프라인 흐름을 안전하게 검증하기 위해 child_process를 모킹합니다.
jest.mock('child_process', () => {
  return {
    execFile: (bin: string, args: string[], callback: (err: any, res: any) => void) => {
      if (bin.includes('pdftotext')) {
        callback(null, { stdout: 'Extracted mock text from pdf file\n' });
      } else if (bin.includes('pdftoppm')) {
        // Simulate pdftoppm producing a page image in the output directory
        // pdftoppm이 출력 임시 디렉토리에 페이지 이미지를 생성해낸 상황을 가상 구현합니다.
        const destPrefix = args[args.length - 1];
        const tempDir = path.dirname(destPrefix);
        const mockPagePath = path.join(tempDir, 'page-1.png');
        try {
          const fsActual = jest.requireActual('fs');
          if (!fsActual.existsSync(tempDir)) {
            fsActual.mkdirSync(tempDir, { recursive: true });
          }
          fsActual.writeFileSync(mockPagePath, 'mock png data');
        } catch (e) {}
        callback(null, { stdout: 'pdftoppm success' });
      } else {
        callback(new Error(`Unknown binary mocked: ${bin}`), null);
      }
    }
  };
});

// Mock fs to simulate poppler binaries exist in bin folder or system PATH
// poppler 바이너리들이 프로젝트 bin 폴더나 시스템 PATH에 존재하는 것으로 가상 구현합니다.
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    existsSync: (filePath: any) => {
      const p = filePath.toString();
      if (p.includes('pdftotext') || p.includes('pdftoppm')) {
        return true;
      }
      return originalFs.existsSync(filePath);
    }
  };
});

describe('PdfParser tests / PDF 파서 테스트', () => {
  let samplePdfPath: string;

  beforeAll(() => {
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
    const parser = new PdfParser({ enableOfflineMode: true, forceMissingBinaries: true });
    await expect(parser.parse(samplePdfPath)).rejects.toThrow('poppler-utils binaries not found');
  });

  it('should be registered to ParserFactory and support .pdf / ParserFactory에 성공적으로 등록되고 .pdf를 처리해야 함', () => {
    const parser = ParserFactory.getParser('dummy.pdf');
    expect(parser).toBeDefined();
    expect(parser).toBeInstanceOf(PdfParser);
    expect(parser.supportedExtensions).toContain('.pdf');
  });

  it('should compile result by merging inline text and vision parser outputs in online mode / 온라인 모드에서 원본 텍스트와 비전 분석 결과가 정상적으로 병합되어야 함', async () => {
    const parser = new PdfParser({ enableOfflineMode: false, apiKey: 'mock_api_key' });
    const content = await parser.parse(samplePdfPath);
    expect(content).toContain('PDF Document Analysis');
    expect(content).toContain('Extracted Text Content');
    expect(content).toContain('Page-by-Page Visual Analysis');
    expect(content).toContain('IMAGE_CONTENT_VISION_EXTRACTION');
  });

  it('should parse offline and aggregate mock vision OCR results / 오프라인 모드에서도 모킹된 비전 OCR 결과를 수집 병합해야 함', async () => {
    const parser = new PdfParser({ enableOfflineMode: true, forceMissingBinaries: false });
    const content = await parser.parse(samplePdfPath);
    expect(content).toContain('Extracted mock text from pdf file');
    expect(content).toContain('VISION/OCR EXTRACTION');
  });
});

