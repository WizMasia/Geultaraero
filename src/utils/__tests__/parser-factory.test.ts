import { ParserFactory, DocumentParser } from '../document-parser';

class MockTxtParser implements DocumentParser {
  readonly supportedExtensions = ['.txt'];
  async parse(filePath: string): Promise<string> {
    return "mock text content";
  }
}

describe('ParserFactory tests', () => {
  beforeAll(() => {
    ParserFactory.registerParser(new MockTxtParser());
  });

  it('should retrieve registered parser for .txt', () => {
    const parser = ParserFactory.getParser('dummy.txt');
    expect(parser).toBeDefined();
    expect(parser.supportedExtensions).toContain('.txt');
  });

  it('should throw an error for unsupported extensions', () => {
    expect(() => ParserFactory.getParser('dummy.pdf')).toThrow('Unsupported file format: .pdf');
  });

  it('should parse document correctly using registered parser', async () => {
    const content = await ParserFactory.parseDocument('dummy.txt');
    expect(content).toBe('mock text content');
  });
});
