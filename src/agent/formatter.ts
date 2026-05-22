import { RunnerAgent } from './runner';

export class FormatterAgent extends RunnerAgent {
  protected generatePrompt(instructionContent: string, toneGuidelines: string[]): string {
    // 사용자 정의 가이드라인 문서를 감지하고 공공 보고서 표준 서식을 포맷터 지침으로 주입합니다.
    // Detect custom guidelines file and inject official report formatting guidelines.
    const guideText = this.loadWritingGuide();
    const guideInjection = guideText
      ? `\n## Custom Formatting Constraints (사용자 서식 가이드라인 준수 제약)
You MUST apply the following official formatting standards when organizing and outputting the final document:
1. **Hierarchical Bullet Indentation (표준 기호체계 및 들여쓰기 층위):**
   Ensure all lists and paragraphs follow these exact bullet markers and indents:
   - Level 1: '☐ ' (No indent or standard start)
   - Level 2: '○ ' (Indented by 1 space)
   - Level 3: '- ' (Indented by 3 spaces)
   - Level 4: '• ' (Indented by 4 spaces)
   - Warnings/References: '※ ' (Indented by 3 to 7 spaces)
2. **Layout & Readability Check (레이아웃 및 가독성 정돈):**
   - Ensure the content distribution is balanced without leaning heavily towards one section.
   - If a table, comparison chart, or list is required, make sure they are aligned neatly in Markdown before export.
`
      : '';

    // 한국어 맞춤법 가이드라인 문서를 감지하고 포맷터 지침으로 주입합니다.
    // Detect Korean spelling guidelines file and inject spelling constraints.
    const spellingText = this.loadSpellingGuide();
    const spellingInjection = spellingText
      ? `\n## Korean Spelling Constraints (한국어 맞춤법 및 띄어쓰기 규정 제약)
Please review the final document and resolve any common Korean spelling and spacing errors based on the following guidelines:
1. **Spelling Rules (자주 틀리는 맞춤법):**
   - Ensure you use '-ㄹ게요' (O) instead of '-ㄹ께요' (X).
   - Use '봬요' (O) instead of '뵈요' (X).
   - Use '왠지' (O), '웬일' (O), '웬만하면' (O) instead of '웬지' (X), '왠일' (X), '왠만하면' (X).
   - Use '금세' (O) instead of '금새' (X), and '며칠' (O) instead of '몇일' (X).
   - Use '삼가다' (O) instead of '삼가하다' (X).
   - Use '익숙지' (O) instead of '익숙치' (X) when prefixing with unvoiced consonants.
2. **Spacing Rules (띄어쓰기 규정):**
   - Correct spacing for dependent nouns like '지' (duration of time), '만' (period of time), '데' (case/place), and '바' (method/fact). (e.g., '만난 지', '얼마 만에', '아픈 데에')
   - Ensure unit nouns are separated by space (e.g., '한 개', '차 한 대').
`
      : '';

    return `
# [AGENT INSTRUCTION: FORMATTER]
You are acting on behalf of the Formatter agent.
**Your Persona:** ${this.persona}

## Task Description
You need to convert the final markdown document into the desired format (e.g., HTML, PDF, PPTX) and extract style guidelines if a template was provided.
---
${instructionContent}
---${guideInjection}${spellingInjection}

## Action Required
1. If a style template is provided, extract ONLY the formatting and tone guidelines from it (ignore the content).
2. If tone guidelines are found, update your \`current_status.md\` frontmatter with \`tone_guidelines\` array so the Representative can propagate them.
3. Convert the finalized markdown document into the requested format and save it in the workspace.
4. Finally, update the Formatter's \`current_status.md\` file:
   - Change \`status\` to "Completed"
   - Include the relative path to your formatted final file in the \`data_paths\` frontmatter array.
   - Write a brief summary of the formatting process in the body.
`;
  }
}
