import * as fs from 'fs';
import * as path from 'path';
import { DocumentParser } from './document-parser';
import { unzip } from './zip-helper';

/**
 * Helper to unescape XML entities.
 * XML 엔티티를 이스케이프 해제하는 헬퍼 함수입니다.
 */
function unescapeXml(xml: string): string {
  return xml
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Helper to convert column letters (A, B, C... Z, AA...) to 0-based column index.
 * 열 문자(A, B, C... Z, AA...)를 0부터 시작하는 열 인덱스로 변환하는 헬퍼 함수입니다.
 */
function colLetterToIndex(colLetter: string): number {
  let index = 0;
  for (let i = 0; i < colLetter.length; i++) {
    index = index * 26 + (colLetter.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Parser for Microsoft Office Open XML formats (.docx, .pptx, .xlsx) without external dependencies.
 * 외부 의존성 없이 Microsoft Office Open XML 포맷(.docx, .pptx, .xlsx)을 파싱하는 클래스입니다.
 */
export class OfficeParser implements DocumentParser {
  readonly supportedExtensions: string[] = ['.docx', '.pptx', '.xlsx'];

  /**
   * Parses the given office document and returns its content in markdown format.
   * 주어진 오피스 문서를 파싱하고 마크다운 형식으로 본문을 반환합니다.
   */
  public async parse(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    // Create a unique temporary directory inside the workspace
    // 워크스페이스 내에 고유한 임시 디렉토리를 생성합니다.
    const tempDirName = `.temp_office_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const tempDir = path.join(process.cwd(), tempDirName);

    try {
      // Unzip the office file to the temporary directory
      // 오피스 파일을 임시 디렉토리에 압축 해제합니다.
      await unzip(filePath, tempDir);

      switch (ext) {
        case '.docx':
          return await this.parseDocx(tempDir);
        case '.pptx':
          return await this.parsePptx(tempDir);
        case '.xlsx':
          return await this.parseXlsx(tempDir);
        default:
          throw new Error(`Unsupported extension inside OfficeParser: ${ext}`);
      }
    } finally {
      // Always cleanup temporary directory
      // 임시 디렉토리를 항상 깨끗이 정리합니다.
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  /**
   * Parses Word Document (.docx) content.
   * 워드 문서(.docx) 내용을 파싱합니다.
   */
  private async parseDocx(tempDir: string): Promise<string> {
    const docXmlPath = path.join(tempDir, 'word', 'document.xml');
    if (!fs.existsSync(docXmlPath)) {
      throw new Error('Invalid docx file: word/document.xml not found.');
    }

    const xmlContent = fs.readFileSync(docXmlPath, 'utf-8');
    
    // Extract paragraphs <w:p> and text nodes <w:t>
    // 문단 <w:p> 및 텍스트 노드 <w:t>를 추출합니다.
    const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
    const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
    
    const paragraphs: string[] = [];
    let pMatch: RegExpExecArray | null;

    while ((pMatch = pRegex.exec(xmlContent)) !== null) {
      const pContent = pMatch[1];
      let tMatch: RegExpExecArray | null;
      let pText = '';
      
      while ((tMatch = tRegex.exec(pContent)) !== null) {
        pText += tMatch[1];
      }
      
      if (pText.trim().length > 0) {
        paragraphs.push(unescapeXml(pText));
      }
    }

    return paragraphs.join('\n\n');
  }

  /**
   * Parses PowerPoint Presentation (.pptx) content.
   * 파워포인트 프리젠테이션(.pptx) 내용을 파싱합니다.
   */
  private async parsePptx(tempDir: string): Promise<string> {
    const slidesDir = path.join(tempDir, 'ppt', 'slides');
    if (!fs.existsSync(slidesDir)) {
      throw new Error('Invalid pptx file: ppt/slides directory not found.');
    }

    // List all slide xml files and sort them numerically
    // 모든 슬라이드 xml 파일을 나열하고 숫자 순서대로 정렬합니다.
    const slideFiles = fs.readdirSync(slidesDir)
      .filter(file => file.startsWith('slide') && file.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
        const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
        return numA - numB;
      });

    const parsedSlides: string[] = [];
    const tRegex = /<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g;

    for (const slideFile of slideFiles) {
      const slidePath = path.join(slidesDir, slideFile);
      const xmlContent = fs.readFileSync(slidePath, 'utf-8');
      
      let tMatch: RegExpExecArray | null;
      const slideTexts: string[] = [];

      while ((tMatch = tRegex.exec(xmlContent)) !== null) {
        slideTexts.push(unescapeXml(tMatch[1]));
      }

      const slideNum = slideFile.replace(/[^0-9]/g, '');
      const slideHeader = `## Slide ${slideNum}\n`;
      parsedSlides.push(slideHeader + slideTexts.join(' '));
    }

    return parsedSlides.join('\n\n---\n\n');
  }

  /**
   * Parses Excel Spreadsheet (.xlsx) content.
   * 엑셀 스프레드시트(.xlsx) 내용을 파싱합니다.
   */
  private async parseXlsx(tempDir: string): Promise<string> {
    // 1. Load shared strings to resolve index-based text cell values
    // 1. 인덱스 기반의 텍스트 셀 값을 매핑하기 위해 shared strings를 로드합니다.
    const sharedStrings: string[] = [];
    const sharedStringsPath = path.join(tempDir, 'xl', 'sharedStrings.xml');
    if (fs.existsSync(sharedStringsPath)) {
      const ssXml = fs.readFileSync(sharedStringsPath, 'utf-8');
      const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
      let tMatch: RegExpExecArray | null;
      while ((tMatch = tRegex.exec(ssXml)) !== null) {
        sharedStrings.push(unescapeXml(tMatch[1]));
      }
    }

    // 2. Locate worksheet XMLs
    // 2. 워크시트 XML들의 위치를 탐색합니다.
    const worksheetsDir = path.join(tempDir, 'xl', 'worksheets');
    if (!fs.existsSync(worksheetsDir)) {
      throw new Error('Invalid xlsx file: xl/worksheets directory not found.');
    }

    const sheetFiles = fs.readdirSync(worksheetsDir)
      .filter(file => file.startsWith('sheet') && file.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
        const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
        return numA - numB;
      });

    const parsedSheets: string[] = [];

    for (const sheetFile of sheetFiles) {
      const sheetPath = path.join(worksheetsDir, sheetFile);
      const xmlContent = fs.readFileSync(sheetPath, 'utf-8');

      // Simple parser for rows and cells
      // 행과 셀을 파싱하기 위한 간단한 파서입니다.
      const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
      const cellRegex = /<c\b[^>]*>([\s\S]*?)<\/c>/g;
      const valRegex = /<v\b[^>]*>([\s\S]*?)<\/v>/;

      // Map to represent sheet grid: Row -> Column -> Cell Value
      // 시트 그리드를 나타내기 위한 맵: 행 -> 열 -> 셀 값
      const grid: Map<number, Map<number, string>> = new Map();
      let maxColIndex = -1;
      let maxRowIndex = -1;

      let rowMatch: RegExpExecArray | null;
      while ((rowMatch = rowRegex.exec(xmlContent)) !== null) {
        const rowXml = rowMatch[1];
        
        // Extract row number (r attribute)
        // 행 번호를 추출합니다 (r 속성).
        const rowRefMatch = rowMatch[0].match(/r="([0-9]+)"/);
        if (!rowRefMatch) continue;
        const rowIndex = parseInt(rowRefMatch[1], 10) - 1; // Convert to 0-based
        maxRowIndex = Math.max(maxRowIndex, rowIndex);

        const colMap: Map<number, string> = new Map();
        let cellMatch: RegExpExecArray | null;

        while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
          const cellXml = cellMatch[0];
          const cellInner = cellMatch[1];

          // Extract cell reference (e.g. A1, C5)
          // 셀 참조값(예: A1, C5)을 추출합니다.
          const refMatch = cellXml.match(/r="([A-Z]+)([0-9]+)"/);
          if (!refMatch) continue;
          
          const colLetter = refMatch[1];
          const colIndex = colLetterToIndex(colLetter);
          maxColIndex = Math.max(maxColIndex, colIndex);

          // Check cell type (t attribute)
          // 셀 타입(t 속성)을 확인합니다.
          const isSharedString = /t="s"|t='s'/.test(cellXml);

          const vMatch = valRegex.exec(cellInner);
          let value = '';
          if (vMatch) {
            const rawVal = vMatch[1];
            if (isSharedString) {
              const strIndex = parseInt(rawVal, 10);
              value = sharedStrings[strIndex] || '';
            } else {
              value = unescapeXml(rawVal);
            }
          }
          
          if (value.trim().length > 0) {
            colMap.set(colIndex, value);
          }
        }

        if (colMap.size > 0) {
          grid.set(rowIndex, colMap);
        }
      }

      if (grid.size === 0) continue;

      // Construct markdown table
      // 마크다운 표를 구축합니다.
      const sheetName = sheetFile.replace('.xml', '').replace(/^\w/, c => c.toUpperCase());
      let sheetMarkdown = `### Sheet: ${sheetName}\n\n`;

      // Header row
      // 헤더 행
      let headerLine = '|';
      let separatorLine = '|';
      for (let col = 0; col <= maxColIndex; col++) {
        headerLine += ` Col ${col + 1} |`;
        separatorLine += ' --- |';
      }
      sheetMarkdown += headerLine + '\n' + separatorLine + '\n';

      // Data rows
      // 데이터 행들
      for (let row = 0; row <= maxRowIndex; row++) {
        const colMap = grid.get(row);
        if (!colMap) continue; // Skip completely empty rows / 완전히 비어있는 행은 건너뜁니다.
        
        let rowLine = '|';
        let hasData = false;
        for (let col = 0; col <= maxColIndex; col++) {
          const val = colMap.get(col) || '';
          if (val) hasData = true;
          rowLine += ` ${val} |`;
        }
        
        if (hasData) {
          sheetMarkdown += rowLine + '\n';
        }
      }

      parsedSheets.push(sheetMarkdown.trim());
    }

    return parsedSheets.join('\n\n');
  }
}
