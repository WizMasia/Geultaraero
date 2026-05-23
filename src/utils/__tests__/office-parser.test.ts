import { OfficeParser } from '../office-parser';
import { ParserFactory } from '../document-parser';
import * as fs from 'fs';
import * as path from 'path';
import { zip } from '../zip-helper';

describe('OfficeParser tests / 오피스 파서 테스트', () => {
  const officeParser = new OfficeParser();
  const testWorkspace = path.join(process.cwd(), '.test_office_parser_workspace');

  beforeAll(() => {
    if (!fs.existsSync(testWorkspace)) {
      fs.mkdirSync(testWorkspace, { recursive: true });
    }
    ParserFactory.registerParser(officeParser);
  });

  afterAll(() => {
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  it('should be registered to ParserFactory and support office formats / ParserFactory에 성공적으로 등록되고 오피스 포맷들을 지원해야 함', () => {
    const parser = ParserFactory.getParser('dummy.docx');
    expect(parser).toBeDefined();
    expect(parser).toBeInstanceOf(OfficeParser);
    expect(parser.supportedExtensions).toContain('.docx');
    expect(parser.supportedExtensions).toContain('.pptx');
    expect(parser.supportedExtensions).toContain('.xlsx');
  });

  it('should parse docx successfully / docx 파일을 정상적으로 파싱해야 함', async () => {
    const docxSrc = path.join(testWorkspace, 'docx_src');
    fs.mkdirSync(path.join(docxSrc, 'word'), { recursive: true });
    
    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Hello World Word Document</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Second paragraph &amp; text.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
    fs.writeFileSync(path.join(docxSrc, 'word', 'document.xml'), docXml, 'utf-8');

    const destDocx = path.join(testWorkspace, 'test.docx');
    await zip(docxSrc, destDocx);

    const result = await officeParser.parse(destDocx);
    expect(result).toContain('Hello World Word Document');
    expect(result).toContain('Second paragraph & text.');
  });

  it('should parse pptx successfully / pptx 파일을 정상적으로 파싱해야 함', async () => {
    const pptxSrc = path.join(testWorkspace, 'pptx_src');
    fs.mkdirSync(path.join(pptxSrc, 'ppt', 'slides'), { recursive: true });

    const slide1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>Slide 1 content &amp; details</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

    const slide2Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:txBody>
          <a:p><a:r><a:t>Slide 2 content</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

    fs.writeFileSync(path.join(pptxSrc, 'ppt', 'slides', 'slide1.xml'), slide1Xml, 'utf-8');
    fs.writeFileSync(path.join(pptxSrc, 'ppt', 'slides', 'slide2.xml'), slide2Xml, 'utf-8');

    const destPptx = path.join(testWorkspace, 'test.pptx');
    await zip(pptxSrc, destPptx);

    const result = await officeParser.parse(destPptx);
    expect(result).toContain('## Slide 1');
    expect(result).toContain('Slide 1 content & details');
    expect(result).toContain('## Slide 2');
    expect(result).toContain('Slide 2 content');
  });

  it('should parse xlsx successfully / xlsx 파일을 정상적으로 파싱해야 함', async () => {
    const xlsxSrc = path.join(testWorkspace, 'xlsx_src');
    fs.mkdirSync(path.join(xlsxSrc, 'xl', 'worksheets'), { recursive: true });

    const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="3" uniqueCount="3">
  <si><t>Header 1</t></si>
  <si><t>Header 2</t></si>
  <si><t>Row 1 Col 1</t></si>
</sst>`;

    const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="s"><v>0</v></c>
      <c r="B1" t="s"><v>1</v></c>
    </row>
    <row r="2">
      <c r="A2" t="s"><v>2</v></c>
      <c r="B2"><v>123.45</v></c>
    </row>
  </sheetData>
</worksheet>`;

    fs.writeFileSync(path.join(xlsxSrc, 'xl', 'sharedStrings.xml'), sharedStringsXml, 'utf-8');
    fs.writeFileSync(path.join(xlsxSrc, 'xl', 'worksheets', 'sheet1.xml'), sheet1Xml, 'utf-8');

    const destXlsx = path.join(testWorkspace, 'test.xlsx');
    await zip(xlsxSrc, destXlsx);

    const result = await officeParser.parse(destXlsx);
    expect(result).toContain('### Sheet: Sheet1');
    expect(result).toContain('| Col 1 | Col 2 |');
    expect(result).toContain('| Header 1 | Header 2 |');
    expect(result).toContain('| Row 1 Col 1 | 123.45 |');
  });
});
