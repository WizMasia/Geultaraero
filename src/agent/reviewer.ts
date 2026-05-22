import { RunnerAgent } from './runner';

export class ReviewerAgent extends RunnerAgent {
  private criteria: string[];

  constructor(id: string, role: string, persona: string, workspaceDir: string, criteria: string[] = []) {
    super(id, role, persona, workspaceDir);
    this.criteria = criteria.length > 0 ? criteria : [
      "요구사항 충족도 (Requirement Alignment)",
      "논리적 일관성 (Logical Consistency)",
      "출처 및 팩트의 정확성 (Fact & Source Accuracy)",
      "가독성 및 문체 (Readability & Tone)"
    ];
  }

  protected generatePrompt(instructionContent: string, toneGuidelines: string[]): string {
    // 사용자 정의 가이드라인 문서를 감지하고 검토 기준을 보강합니다.
    // Detect custom guidelines file and enhance review criteria.
    const guideText = this.loadWritingGuide();
    let criteriaList = this.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n');

    if (guideText) {
      criteriaList += `\n5. 정책보고서 10대 핵심 요소 준수 여부 (10 Core Elements check: Goal Clarity, Problem Definition, Actions, etc.)
6. 공공기관 표준 기호체계 및 들여쓰기 층위 정합성 (Hierarchical Bullets: ☐ -> ○ -> - -> • -> ※)
7. 글쓰기 절대 규칙 준수 여부 (Writing Absolutes: Readability for a 14-year-old, 1-line title, 2-line lead, fact-only dry tone)`;
    }

    return `
# [AGENT INSTRUCTION: REVIEWER]
You are acting on behalf of the Reviewer agent.
**Your Persona:** ${this.persona}

## Task Description
You need to review the provided draft or edited document and provide a detailed critique and a score.
---
${instructionContent}
---

## Review Criteria
Please evaluate the document based on the following criteria:
${criteriaList}

## Action Required
1. Thoroughly read the target document with an **extremely strict and critical eye**. Do not be generous with your scoring.
2. Write a detailed critique (Feedback Report) addressing each criterion. For each criterion, you MUST provide explicit reasons and evidence from the text justifying your evaluation.
3. Assign a total score out of 100 based on the absolute quality. Deduct points relentlessly for logical flaws, lack of evidence, or poor readability.
4. Once completed, save your detailed critique as a NEW markdown file in the workspace (e.g., \`review_feedback_v1.md\`).
5. Finally, update the Reviewer's \`current_status.md\` file:
   - Change \`status\` to "Completed"
   - **IMPORTANT**: Set the \`score\` frontmatter field to your assigned integer score (e.g., \`score: 85\`).
   - Include the relative path to your feedback report in the \`data_paths\` frontmatter array.
   - Write a brief summary of your evaluation in the body.
`;
  }
}
