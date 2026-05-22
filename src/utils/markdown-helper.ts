import * as yaml from 'js-yaml';
import * as fs from 'fs';

export interface AgentMessageFrontmatter {
  sender: string;
  receiver?: string;
  timestamp: string;
  message_type: 'INSTRUCTION' | 'STATUS_UPDATE' | 'DELIVERABLE' | 'FEEDBACK' | 'ERROR';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Failed' | 'waiting_for_user' | 'waiting_for_agent';
  data_paths?: string[];
  tone_guidelines?: string[];
  score?: number;
  error?: string;
  [key: string]: any;
}

export interface ParsedMarkdown {
  frontmatter: AgentMessageFrontmatter;
  content: string;
}

/**
 * 마크다운 파일 내용에서 YAML Frontmatter와 본문을 분리하여 파싱합니다.
 * @param fileContent 마크다운 파일 전체 텍스트
 */
export function parseMarkdown(fileContent: string): ParsedMarkdown {
  const frontmatterRegex = /^(?:---\r?\n)([\s\S]*?)(?:---\r?\n)([\s\S]*)$/;
  const match = fileContent.match(frontmatterRegex);

  if (!match) {
    throw new Error('Invalid markdown format: Missing or malformed YAML frontmatter.');
  }

  const yamlString = match[1];
  const content = match[2].trim();

  const frontmatter = yaml.load(yamlString) as AgentMessageFrontmatter;

  return { frontmatter, content };
}

/**
 * 프론트매터 객체와 본문을 합쳐서 마크다운 텍스트를 생성합니다.
 * @param frontmatter 프론트매터 데이터
 * @param content 본문 내용
 */
export function generateMarkdown(frontmatter: AgentMessageFrontmatter, content: string): string {
  const yamlString = yaml.dump(frontmatter, { skipInvalid: true });
  return `---\n${yamlString}---\n\n${content}\n`;
}

/**
 * 지정된 경로의 마크다운 파일을 읽어 파싱합니다.
 * @param filePath 읽을 파일 경로
 */
export function readMarkdownFile(filePath: string): ParsedMarkdown {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return parseMarkdown(fileContent);
}

/**
 * 지정된 경로에 마크다운 파일을 작성합니다.
 * @param filePath 저장할 파일 경로
 * @param frontmatter 프론트매터 데이터
 * @param content 본문 내용
 */
export function writeMarkdownFile(filePath: string, frontmatter: AgentMessageFrontmatter, content: string): void {
  const markdownText = generateMarkdown(frontmatter, content);
  fs.writeFileSync(filePath, markdownText, 'utf-8');
}
