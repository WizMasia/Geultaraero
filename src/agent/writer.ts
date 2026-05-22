import { RunnerAgent } from './runner';

export class WriterAgent extends RunnerAgent {
  protected generatePrompt(instructionContent: string, toneGuidelines: string[]): string {
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
---${toneText}

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
