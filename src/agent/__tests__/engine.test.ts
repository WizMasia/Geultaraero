import * as fs from 'fs';
import * as path from 'path';
import { WorkflowEngine } from '../../engine';
import { ParserFactory } from '../../utils/document-parser';
import { OfficeParser } from '../../utils/office-parser';
import { zip } from '../../utils/zip-helper';
import { readMarkdownFile } from '../../utils/markdown-helper';
import { OrchestrationConfig } from '../../parser';

describe('WorkflowEngine dynamic parser spawning tests / 워크플로우 엔진 동적 파서 할당 테스트', () => {
  const testWorkspace = path.join(process.cwd(), '.test_engine_workspace');
  let config: OrchestrationConfig;
  let doc1Path: string;
  let doc2Path: string;

  beforeAll(async () => {
    if (!fs.existsSync(testWorkspace)) {
      fs.mkdirSync(testWorkspace, { recursive: true });
    }

    // Register OfficeParser to ParserFactory for testing
    // 테스트 동작 검증을 위해 팩토리에 OfficeParser를 등록합니다.
    ParserFactory.registerParser(new OfficeParser());

    // Create two dummy docx files for dynamic parsing test
    // 동적 파싱 테스트를 위한 2개의 더미 docx 파일을 생성합니다.
    const docxSrc1 = path.join(testWorkspace, 'src1');
    fs.mkdirSync(path.join(docxSrc1, 'word'), { recursive: true });
    fs.writeFileSync(path.join(docxSrc1, 'word', 'document.xml'), '<w:document xmlns:w="..."><w:body><w:p><w:t>Doc 1 Text</w:t></w:p></w:body></w:document>', 'utf-8');
    doc1Path = path.join(testWorkspace, 'doc1.docx');
    await zip(docxSrc1, doc1Path);

    const docxSrc2 = path.join(testWorkspace, 'src2');
    fs.mkdirSync(path.join(docxSrc2, 'word'), { recursive: true });
    fs.writeFileSync(path.join(docxSrc2, 'word', 'document.xml'), '<w:document xmlns:w="..."><w:body><w:p><w:t>Doc 2 Text</w:t></w:p></w:body></w:document>', 'utf-8');
    doc2Path = path.join(testWorkspace, 'doc2.docx');
    await zip(docxSrc2, doc2Path);

    // Mock orchestration configuration
    // 모의 오케스트레이션 설정을 정의합니다.
    config = {
      version: '1.0',
      global_settings: {
        workspace_dir: testWorkspace,
        language: 'ko',
        generate_work_summary: false,
      },
      agents: [
        {
          id: 'rep-01',
          role: 'representative',
          persona: 'Planner Persona',
        },
        {
          id: 'parser-master',
          role: 'parser',
          persona: 'Parser Persona',
        },
      ],
      workflow: [
        {
          step: 1,
          type: 'sequential',
          agents: ['parser-master'],
        },
      ],
    };
  });

  afterAll(() => {
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  it('should dynamically spawn independent parser agents per file and aggregate results / 파일당 독립 파서 에이전트를 동적으로 생성하고 결과를 취합해야 함', async () => {
    // 1. Write the initial mock state for representative agent declaring target documents
    // 1. 대표 에이전트 폴더에 파싱 대상 문서 경로 메타데이터를 담은 모의 상태 파일을 기록합니다.
    const repDir = path.join(testWorkspace, 'rep-01');
    fs.mkdirSync(repDir, { recursive: true });
    
    // Paths relative to workspaceDir
    const relDoc1 = path.relative(testWorkspace, doc1Path);
    const relDoc2 = path.relative(testWorkspace, doc2Path);

    const repStatusContent = `---
sender: rep-01
message_type: STATUS_UPDATE
status: Completed
data_paths:
  - ${relDoc1}
  - ${relDoc2}
---
Ready for parsing.`;
    fs.writeFileSync(path.join(repDir, 'current_status.md'), repStatusContent, 'utf-8');

    // 2. Initialize WorkflowEngine and run step
    // 2. 워크플로우 엔진을 초기화하고 가동합니다.
    const engine = new WorkflowEngine(config);
    await engine.run();

    // 3. Verify that independent sub-agents were spawned in workspace
    // 3. 개별 격리된 하위 파서 에이전트 디렉토리가 생성되었는지 확인합니다.
    const childAgent1Dir = path.join(testWorkspace, 'parser-master-file-0');
    const childAgent2Dir = path.join(testWorkspace, 'parser-master-file-1');

    expect(fs.existsSync(childAgent1Dir)).toBe(true);
    expect(fs.existsSync(childAgent2Dir)).toBe(true);

    // Verify individual files were parsed correctly inside child agent dirs
    // 개별 자식 에이전트 폴더 내부에 각 파일이 정상 파싱 및 보관되었는지 검증합니다.
    const parsedFile1 = path.join(childAgent1Dir, 'parsed_doc1.docx.md');
    const parsedFile2 = path.join(childAgent2Dir, 'parsed_doc2.docx.md');

    expect(fs.existsSync(parsedFile1)).toBe(true);
    expect(fs.existsSync(parsedFile2)).toBe(true);

    expect(fs.readFileSync(parsedFile1, 'utf-8')).toContain('Doc 1 Text');
    expect(fs.readFileSync(parsedFile2, 'utf-8')).toContain('Doc 2 Text');

    // 4. Verify aggregated results in master parser agent status
    // 4. 마스터 파서 에이전트의 최종 상태 파일에 전체 결과 경로가 병합 수집되었는지 검증합니다.
    const masterStatusPath = path.join(testWorkspace, 'parser-master', 'current_status.md');
    expect(fs.existsSync(masterStatusPath)).toBe(true);

    const { frontmatter } = readMarkdownFile(masterStatusPath);
    expect(frontmatter.status).toBe('Completed');
    
    const aggregatedPaths = frontmatter.data_paths as string[];
    expect(aggregatedPaths).toBeDefined();
    expect(aggregatedPaths.length).toBe(2);
    expect(aggregatedPaths).toContain(path.relative(testWorkspace, parsedFile1));
    expect(aggregatedPaths).toContain(path.relative(testWorkspace, parsedFile2));
  });
});
