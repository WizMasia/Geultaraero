import * as fs from 'fs';
import * as path from 'path';
import { ParserAgent } from '../parser';
import { ParserFactory } from '../../utils/document-parser';
import { OfficeParser } from '../../utils/office-parser';
import { zip } from '../../utils/zip-helper';
import { readMarkdownFile } from '../../utils/markdown-helper';

describe('ParserAgent tests / 파서 에이전트 테스트', () => {
  const testWorkspace = path.join(process.cwd(), '.test_parser_agent_workspace');
  let parserAgent: ParserAgent;
  let testDocxPath: string;

  beforeAll(async () => {
    // Ensure test workspace exists
    // 테스트 워크스페이스 디렉토리를 확보합니다.
    if (!fs.existsSync(testWorkspace)) {
      fs.mkdirSync(testWorkspace, { recursive: true });
    }

    // Register OfficeParser to ParserFactory for testing
    // 테스트 동작 검증을 위해 팩토리에 OfficeParser를 미리 등록합니다.
    ParserFactory.registerParser(new OfficeParser());

    // Create a dummy docx file using zip utility
    // zip 유틸을 이용해 테스트용 더미 docx 파일을 빌드합니다.
    const docxSrc = path.join(testWorkspace, 'test_docx_src');
    fs.mkdirSync(path.join(docxSrc, 'word'), { recursive: true });
    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:t>Hello Parser Agent Document</w:t></w:p>
  </w:body>
</w:document>`;
    fs.writeFileSync(path.join(docxSrc, 'word', 'document.xml'), docXml, 'utf-8');

    testDocxPath = path.join(testWorkspace, 'input_doc.docx');
    await zip(docxSrc, testDocxPath);

    // Initialize ParserAgent
    // 파서 에이전트를 생성합니다.
    parserAgent = new ParserAgent('parser-test-id', 'parser', 'Parser Persona', testWorkspace);
  });

  afterAll(() => {
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  it('should parse files in instruction data_paths and publish completed status / 지시서의 data_paths 파일들을 파싱하고 최종 Completed 상태를 발행해야 함', async () => {
    const agentDir = path.join(testWorkspace, 'parser-test-id');
    
    // Create mock instruction message file under agent folder
    // 에이전트 폴더 내부에 모의 지시서 메시지 파일을 생성합니다.
    const relativeInputPath = path.relative(testWorkspace, testDocxPath);
    const instructionContent = `---
sender: representative
receiver: parser-test-id
message_type: INSTRUCTION
status: Pending
data_paths:
  - ${relativeInputPath}
---
Please parse these incoming raw files.`;
    
    const msgPath = path.join(agentDir, 'msg_representative_12345.md');
    fs.writeFileSync(msgPath, instructionContent, 'utf-8');

    // Run ParserAgent execute
    // 파서 에이전트를 가동합니다.
    await parserAgent.execute();

    // Verify parser status
    // 파서 상태 파일 검증
    const statusPath = path.join(agentDir, 'current_status.md');
    expect(fs.existsSync(statusPath)).toBe(true);

    const { frontmatter, content } = readMarkdownFile(statusPath);
    expect(frontmatter.status).toBe('Completed');
    const dataPaths = frontmatter.data_paths as string[];
    expect(dataPaths).toBeDefined();
    expect(dataPaths.length).toBe(1);

    // Verify parsed output exists
    // 파싱된 마크다운 결과물 파일 검증
    const parsedRelativePath = dataPaths[0];
    const parsedAbsolutePath = path.join(testWorkspace, parsedRelativePath);
    expect(fs.existsSync(parsedAbsolutePath)).toBe(true);

    const parsedContent = fs.readFileSync(parsedAbsolutePath, 'utf-8');
    expect(parsedContent).toContain('Hello Parser Agent Document');
    expect(content).toContain('Successfully parsed');
  });

  it('should include instructions to prioritize custom installed skills or MCP tools / 설치된 커스텀 스킬이나 MCP 도구를 우선순위로 사용하도록 명시해야 함', async () => {
    const agentDir = path.join(testWorkspace, 'parser-test-id');
    const statusPath = path.join(agentDir, 'current_status.md');

    const { content } = readMarkdownFile(statusPath);
    expect(content).toContain('custom parsing skills');
    expect(content).toContain('MCP');
    expect(content).toContain('우선');
  });
});
