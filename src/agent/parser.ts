import * as fs from 'fs';
import * as path from 'path';
import { BaseAgent } from './base';
import { ParserFactory } from '../utils/document-parser';
import { readMarkdownFile } from '../utils/markdown-helper';
import { Logger } from '../utils/logger';

/**
 * Agent specialized in parsing various document formats (HWP, PDF, Image, MS Office)
 * and writing the parsed contents as markdown files in the workspace.
 * 다양한 문서 포맷(HWP, PDF, 이미지, MS 오피스)을 파싱하여 워크스페이스 내에
 * 마크다운 파일로 저장하는 것을 전담하는 파일 파싱 전문 에이전트 클래스입니다.
 */
export class ParserAgent extends BaseAgent {
  /**
   * Initializes the ParserAgent instance.
   * ParserAgent 인스턴스를 초기화합니다.
   * @param id Agent ID / 에이전트 ID
   * @param role Agent role (should be 'parser') / 에이전트 역할군 ('parser' 권장)
   * @param persona Agent persona description / 에이전트 페르소나 설명
   * @param workspaceDir Workspace absolute path / 워크스페이스 절대 경로
   */
  constructor(id: string, role: string, persona: string, workspaceDir: string) {
    super(id, role, persona, workspaceDir);
  }

  /**
   * Main execution logic. Reads incoming file path lists, parses them,
   * saves them as markdown files, and publishes the Completed status with output data_paths.
   * 메인 실행 로직입니다. 입력받은 파일 경로 목록을 읽어 파싱한 후 마크다운 파일로 저장하고,
   * 결과물 파일들의 상대 경로를 data_paths로 명시하여 Completed 상태를 발행합니다.
   * @param instructionPath Path to the instruction markdown file / 지시서 마크다운 파일 경로 (선택)
   */
  public async execute(instructionPath?: string): Promise<void> {
    const skillInstruction = 
      '※ [IMPORTANT INSTRUCTION FOR PARSING / 파싱 중요 규칙]:\n' +
      'If there are custom parsing skills (e.g., pdf-to-markdown, hwp-to-markdown) or any custom MCP server tools installed in the workspace/environment, the agent MUST prioritize using those skills or MCP tools to parse the document files.\n' +
      '만약 워크스페이스 또는 환경 내에 사용자 정의 파싱 스킬(예: pdf-to-markdown, hwp-to-markdown)이나 커스텀 MCP 서버 도구가 설치되어 있는 경우, 에이전트는 반드시 해당 스킬 또는 MCP 도구를 최우선으로 구동하여 문서 파싱을 처리해야 합니다.';

    this.publishStatus('In Progress', 'STATUS_UPDATE', `Starting document parser agent execution...\n\n${skillInstruction}`);

    let targetInstructionPath: string | undefined = instructionPath;

    // 1. If instructionPath is not provided, look for the most recent message msg_*.md in the agent folder
    // 1. 지시서 경로가 직접 제공되지 않은 경우, 에이전트 디렉토리 내의 msg_*.md 중 가장 최신 메시지 파일을 탐색합니다.
    if (!targetInstructionPath) {
      if (fs.existsSync(this.agentDir)) {
        const files: string[] = fs.readdirSync(this.agentDir);
        const msgFiles = files
          .filter((f: string) => f.startsWith('msg_') && f.endsWith('.md'))
          .map((f: string) => ({
            name: f,
            time: fs.statSync(path.join(this.agentDir, f)).mtimeMs,
          }))
          .sort((a, b) => b.time - a.time);

        if (msgFiles.length > 0) {
          targetInstructionPath = path.join(this.agentDir, msgFiles[0].name);
        }
      }
    }

    // 2. If no instruction is found, complete immediately with empty results
    // 2. 읽을 수 있는 지시서가 없는 경우, 빈 데이터 경로와 함께 즉시 완료를 보고합니다.
    if (!targetInstructionPath) {
      Logger.warn(`[${this.id}] No instruction file or message found for ParserAgent.`);
      this.publishStatus('Completed', 'STATUS_UPDATE', 'No documents to parse (no instruction file provided).', {
        data_paths: [],
      });
      return;
    }

    Logger.agent(this.id, `Reading parsing instruction from: ${targetInstructionPath}`);
    let dataPaths: string[] = [];

    try {
      const { frontmatter } = readMarkdownFile(targetInstructionPath);
      if (frontmatter.data_paths && Array.isArray(frontmatter.data_paths)) {
        dataPaths = frontmatter.data_paths as string[];
      }
    } catch (e: any) {
      const errMsg = `Failed to read parsing instruction file: ${e.message}`;
      this.publishStatus('Failed', 'ERROR', errMsg);
      Logger.error(`[${this.id}] ${errMsg}`);
      throw e;
    }

    if (dataPaths.length === 0) {
      Logger.agent(this.id, 'No source files specified in metadata (data_paths).');
      this.publishStatus('Completed', 'STATUS_UPDATE', 'No source files specified for parsing.', {
        data_paths: [],
      });
      return;
    }

    const parsedFiles: string[] = [];

    // 3. Process each document path sequentially
    // 3. 나열된 문서 경로를 순차적으로 처리합니다.
    for (const filePath of dataPaths) {
      // Resolve path relative to workspace directory if not absolute
      // 절대 경로가 아닐 경우 워크스페이스 디렉토리를 기준으로 경로를 확인합니다.
      const absPath: string = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(this.workspaceDir, filePath);

      if (!fs.existsSync(absPath)) {
        Logger.warn(`[${this.id}] Parser target file not found: ${absPath}`);
        continue;
      }

      const baseName = path.basename(absPath);
      Logger.agent(this.id, `Processing file: ${baseName}`);

      try {
        const parsedContent = await ParserFactory.parseDocument(absPath);

        // Save parsed content to agent's output folder
        // 파싱된 본문 데이터를 에이전트의 출력 전용 폴더에 마크다운으로 보관합니다.
        const outputFileName = `parsed_${baseName}.md`;
        const outputPath = path.join(this.agentDir, outputFileName);

        fs.writeFileSync(outputPath, parsedContent, 'utf-8');
        Logger.agent(this.id, `Parsed markdown saved to: ${outputPath}`);

        // Track relative path from workspace directory
        // 워크스페이스 디렉토리 기준의 상대 경로를 수집합니다.
        const relativePath = path.relative(this.workspaceDir, outputPath);
        parsedFiles.push(relativePath);
      } catch (parseError: any) {
        Logger.error(`[${this.id}] Failed to parse ${baseName}: ${parseError.message}`);
        // Log error status or output partial error reports if needed
      }
    }

    // 4. Publish Completed status with references to the output files
    // 4. 최종 파싱된 결과 마크다운 파일들의 위치와 함께 Completed 상태를 최종 발행합니다.
    this.publishStatus('Completed', 'STATUS_UPDATE', `Successfully parsed ${parsedFiles.length} source document(s).`, {
      data_paths: parsedFiles,
    });
  }
}
