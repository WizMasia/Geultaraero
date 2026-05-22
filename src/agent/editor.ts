import { RunnerAgent } from './runner';

export class EditorAgent extends RunnerAgent {
  protected generatePrompt(instructionContent: string, toneGuidelines: string[]): string {
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
---${toneText}

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
