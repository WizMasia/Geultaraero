import { RunnerAgent } from './runner';

export class EditorAgent extends RunnerAgent {
  protected generatePrompt(instructionContent: string, toneGuidelines: string[]): string {
    // 사용자 정의 가이드라인 문서를 감지하고 공공언어 순화 규정을 편집 지침으로 주입합니다.
    // Detect custom guidelines file and inject official public language styling rules.
    const guideText = this.loadWritingGuide();
    const guideInjection = guideText
      ? `\n## Public Language Style Constraints (공공언어 집필 표준 제약)
Please review and edit the document based on the following standards from the writing guide:
- **Clarity & Accessibility (소통성):** Replace difficult hanja idioms and bureaucratized jargon with simple, natural Korean words.
- **Banning Translative Postpositions (번역투 조사 배제):** Avoid constructs like "~에 있어서" (in terms of) or "~에 기하여" (based on). Rewrite them using natural Korean particles and phrasing.
- **Inclusiveness & Decency (공공성):** Eliminate authoritative tones and avoid any biased, discriminatory, or exclusionary terms (regarding gender, disabilities, etc.).
`
      : '';

    const toneText = toneGuidelines.length > 0 
      ? `\n## Tone Guidelines\nPlease ensure the edited document adheres strictly to these styles: \n- ${toneGuidelines.join('\n- ')}\n` 
      : '';

    return `
# [AGENT INSTRUCTION: EDITOR]
You are acting on behalf of the Editor agent.
**Your Persona:** ${this.persona}

## Task Description
You need to polish, proofread, and edit the drafted document. If there are Reviewer feedbacks provided, you MUST address them.
---
${instructionContent}
---${guideInjection}${toneText}

## Action Required
1. Read the draft document and any reviewer feedback referenced in the instruction.
2. Polish the text, correct any grammatical errors, improve readability, and ensure logical flow.
3. Once completed, save your edited document as a NEW markdown file in the workspace (e.g., \`edited_v1.md\`).
4. Finally, update the Editor's \`current_status.md\` file:
   - Change \`status\` to "Completed"
   - Include the relative path to your edited document in the \`data_paths\` frontmatter array.
   - Write a brief summary of what you changed in the body.
`;
  }
}
