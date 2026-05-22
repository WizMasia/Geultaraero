import { RunnerAgent } from './runner';

export class ExplorerAgent extends RunnerAgent {
  protected generatePrompt(instructionContent: string, toneGuidelines: string[]): string {
    return `
# [AGENT INSTRUCTION: EXPLORER]
You are acting on behalf of the Explorer agent. 
**Your Persona:** ${this.persona}

## Task Description
The Representative has assigned you the following research task:
---
${instructionContent}
---

## Action Required
1. Search the web, local workspace, or user-provided files to gather relevant information.
2. Synthesize and organize the gathered data logically.
3. Once completed, create a NEW markdown file in the workspace containing your research report.
4. Finally, update the Explorer's \`current_status.md\` file:
   - Change \`status\` to "Completed"
   - Include the relative path to your newly created research report in the \`data_paths\` frontmatter array.
   - Write a brief summary of what you found in the body of \`current_status.md\`.
`;
  }
}
