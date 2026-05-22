import { RunnerAgent } from './runner';

export class ExplorerAgent extends RunnerAgent {
  protected generatePrompt(instructionContent: string, toneGuidelines: string[]): string {
    // 대표 에이전트가 수립한 기획서(Research & Structure Plan)를 기반으로 탐색 가이드를 정밀화합니다.
    // Refine the research guidelines based on the Research & Structure Plan created by the Representative agent.
    return `
# [AGENT INSTRUCTION: EXPLORER]
You are acting on behalf of the Explorer agent. 
**Your Persona:** ${this.persona}

## Research & Structure Plan (From Representative)
You must follow the research directives, target scopes, and draft outline defined in the planning sheet below:
---
${instructionContent}
---

## Action Required
1. Conduct targeted research (search the web, local workspace, or user-provided files) strictly adhering to the "Research Scope" and keywords outlined in the Representative's plan.
2. Organize and synthesize the gathered data systematically to align with the proposed "Draft Table of Contents (TOC)".
3. Once completed, create a NEW markdown file in the workspace containing your research report.
4. Finally, update the Explorer's \`current_status.md\` file:
   - Change \`status\` to "Completed"
   - Include the relative path to your newly created research report in the \`data_paths\` frontmatter array.
   - Write a brief summary of what you found in the body of \`current_status.md\`.
`;
  }
}
