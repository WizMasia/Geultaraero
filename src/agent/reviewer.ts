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
    const criteriaList = this.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n');

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
1. Thoroughly read the target document.
2. Write a detailed critique (Feedback Report) addressing each criterion.
3. Assign a total score out of 100 based on the quality.
4. Once completed, save your critique as a NEW markdown file in the workspace (e.g., \`review_feedback_v1.md\`).
5. Finally, update the Reviewer's \`current_status.md\` file:
   - Change \`status\` to "Completed"
   - **IMPORTANT**: Set the \`score\` frontmatter field to your assigned integer score (e.g., \`score: 85\`).
   - Include the relative path to your feedback report in the \`data_paths\` frontmatter array.
   - Write a brief summary of your evaluation in the body.
`;
  }
}
