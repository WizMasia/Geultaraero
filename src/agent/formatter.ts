import { RunnerAgent } from './runner';

export class FormatterAgent extends RunnerAgent {
  protected generatePrompt(instructionContent: string, toneGuidelines: string[]): string {
    return `
# [AGENT INSTRUCTION: FORMATTER]
You are acting on behalf of the Formatter agent.
**Your Persona:** ${this.persona}

## Task Description
You need to convert the final markdown document into the desired format (e.g., HTML, PDF, PPTX) and extract style guidelines if a template was provided.
---
${instructionContent}
---

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
