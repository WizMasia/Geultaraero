const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 지원하는 룰 파일 목록과 각각을 대변하는 대표 파일 하나
const RULES = {
  cursor: '.cursorrules',
  windsurf: '.windsurfrules',
  cline: '.clinerules',
  claude: 'CLAUDE.md',
  generic: 'AI_INSTRUCTIONS.md'
};

function detectIDE() {
  if (process.env.CURSOR_VERSION || process.env.CURSOR_CLIENT_ID) {
    return 'cursor';
  }
  if (process.env.TERM_PROGRAM === 'Windsurf' || process.env.WINDSURF_VERSION) {
    return 'windsurf';
  }
  if (process.env.CLAUDE_VERSION || process.env.CLAUDE_CODE) {
    return 'claude';
  }
  return null;
}

function cleanupRules(selectedIde) {
  const fileToKeep = RULES[selectedIde] || RULES['generic'];
  console.log(`\n🧹 [WizWriting Supporter] Cleaning up environment for: ${selectedIde.toUpperCase()}`);
  console.log(`✅ Keeping rule file: ${fileToKeep}`);

  const rootDir = process.cwd();
  
  Object.values(RULES).forEach((filename) => {
    if (filename !== fileToKeep) {
      const filePath = path.join(rootDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted: ${filename}`);
        } catch (e) {
          console.error(`Failed to delete ${filename}: ${e.message}`);
        }
      }
    }
  });
  console.log('✨ Workspace is now perfectly optimized for your IDE!\n');
}

async function askUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🤖 [WizWriting Supporter Setup]');
  console.log('We could not automatically detect your AI IDE.');
  console.log('To clean up unnecessary rule files, please select your IDE:');
  console.log('1) Cursor');
  console.log('2) Windsurf');
  console.log('3) Claude Code');
  console.log('4) Cline');
  console.log('5) Other / Keep all');

  return new Promise((resolve) => {
    rl.question('\nEnter a number (1-5): ', (answer) => {
      rl.close();
      const choice = answer.trim();
      if (choice === '1') resolve('cursor');
      else if (choice === '2') resolve('windsurf');
      else if (choice === '3') resolve('claude');
      else if (choice === '4') resolve('cline');
      else resolve('keep_all');
    });
  });
}

async function main() {
  const detected = detectIDE();
  
  if (detected) {
    cleanupRules(detected);
  } else {
    // Cannot detect? Ask human
    const choice = await askUser();
    if (choice === 'keep_all') {
      console.log('👍 Kept all rule files. Setup complete.\n');
    } else {
      cleanupRules(choice);
    }
  }
}

main();
