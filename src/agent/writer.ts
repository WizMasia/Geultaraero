import { RunnerAgent } from './runner';

export class WriterAgent extends RunnerAgent {
  protected generatePrompt(instructionContent: string, toneGuidelines: string[]): string {
    // 사용자 정의 가이드라인 문서를 감지하고 공공 보고서 글쓰기 서식을 강제 주입합니다.
    // Detect custom guidelines file and inject official report writing formats.
    const guideText = this.loadWritingGuide();
    const guideInjection = guideText
      ? `\n## Custom Report Writing Constraints (사용자 글쓰기 가이드라인 준수 제약)
You MUST strictly adhere to the following rules extracted from the custom writing guide:
1. **Document Structure & Hierarchical Bullet Points (표준 서식 및 기호체계 규정):**
   Use these exact hierarchical bullet indicators and indentation levels:
   - Level 1 (Main body paragraphs): Start with '☐ '
   - Level 2 (Sub-sections under Level 1): Start with '○ ' (Indented by 1 spaces)
   - Level 3 (Details under Level 2): Start with '- ' (Indented by 3 spaces)
   - Level 4 (Sub-items under Level 3): Start with '• ' (Indented by 4 spaces)
   - Warnings/References: Start with '※ ' (Indented by 3 to 7 spaces)
2. **Writing Absolutes (글쓰기 절대 규칙 - 중2 가용성):**
   - **Middle Schooler's Readability (중2 가용성):** Make the draft extremely clear and easy so that a 14-year-old middle schooler can fully understand it on a single read.
   - **1-Line Title (1줄 메인 타이틀):** Consolidate title headers into a single, punchy line. Avoid multi-line titles.
   - **2-Line Lead Sentence (2줄 리드문):** Write introduction paragraphs in under 2 lines to deliver the conclusion instantly.
   - **Fact-Only Dry Tone (철저한 건조체 준수):** Eliminate adjectives, emotions, self-praise, or decorative words. Write purely 100% objective facts.
`
      : '';

    const toneText = toneGuidelines.length > 0 
      ? `\n## Tone Guidelines\nPlease ensure the draft adheres strictly to these styles: \n- ${toneGuidelines.join('\n- ')}\n` 
      : '';

    return `
# [AGENT INSTRUCTION: WRITER]
You are acting on behalf of the Writer agent.
**Your Persona:** ${this.persona}

## Task Description
You need to draft a report or document based on the following instructions and gathered materials:
---
${instructionContent}
---${guideInjection}${toneText}

## Action Required
1. Read the research materials referenced in the instruction.
2. Draft the document in Markdown format.
3. Once completed, save your draft as a NEW markdown file in the workspace (e.g., \`draft_v1.md\`).
4. Finally, update the Writer's \`current_status.md\` file:
   - Change \`status\` to "Completed"
   - Include the relative path to your draft file in the \`data_paths\` frontmatter array.
   - Write a brief summary of the drafting process in the body.
`;
  }
}
