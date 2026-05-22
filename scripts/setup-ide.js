const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 지원하는 룰 파일 매핑 정보 / Mapping of supported rule files for each IDE/Agent
const FILES_TO_KEEP_BY_IDE = {
  antigravity: [], // .agent/ 폴더 내에 배치하므로 루트 파일 없음 / No root files, placed inside .agent/
  cursor: ['.cursorrules'],
  windsurf: ['.windsurfrules'],
  cline: ['.clinerules'],
  claude: ['CLAUDE.md'],
  opencode: [], // .agent/ 폴더 내에 배치하므로 루트 파일 없음 / No root files, placed inside .agent/
  hermes: [], // .agent/ 폴더 내에 배치하므로 루트 파일 없음 / No root files, placed inside .agent/
  codex: [], // .codex/ 폴더 내에 배치하므로 루트 파일 없음 / No root files, placed inside .codex/
  generic: ['AI_INSTRUCTIONS.md']
};

// 청소 대상이 되는 모든 생성 가능한 루트 규칙 파일 목록 (AGENT.md 제외) / List of all potential root rule files that can be cleaned up (excluding AGENT.md)
const ALL_GENERATED_FILES = [
  'Antigravity.md',
  '.cursorrules',
  '.windsurfrules',
  '.clinerules',
  'CLAUDE.md',
  'Hermes.md',
  'SOUL.md',
  'AGENTS.md',
  'AI_INSTRUCTIONS.md'
];

function detectIDE() {
  if (process.env.ANTIGRAVITY || process.env.ANTIGRAVITY_IDE_VERSION) {
    return 'antigravity';
  }
  if (process.env.OPENCODE_VERSION || process.env.OPENCODE_AGENT) {
    return 'opencode';
  }
  if (process.env.HERMES_AGENT || process.env.HERMES_VERSION) {
    return 'hermes';
  }
  if (process.env.CODEX_VERSION || process.env.CODEX_AGENT) {
    return 'codex';
  }
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
  const keepList = FILES_TO_KEEP_BY_IDE[selectedIde] || FILES_TO_KEEP_BY_IDE['generic'];
  console.log(`\n🧹 [글타래로 (Geultaraero)] Optimizing environment for: ${selectedIde.toUpperCase()}`);

  const rootDir = process.cwd();
  const agentMdPath = path.join(rootDir, 'AGENT.md');
  const agentDir = path.join(rootDir, '.agent');

  // 1. AGENT.md에서 룰 내용 읽기 / Read rule content from AGENT.md
  if (!fs.existsSync(agentMdPath)) {
    console.error(`❌ Error: AGENT.md not found at ${agentMdPath}`);
    return;
  }
  const agentContent = fs.readFileSync(agentMdPath, 'utf8');

  // 2. .agent 폴더 생성 및 공통 .agent/AGENT.md 및 settings.json 쓰기 (이용 가능 여부 체크) / Create .agent directory and write common .agent/AGENT.md & settings.json (and check if it's available)
  let canUseAgentDir = false;
  try {
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }
    fs.writeFileSync(path.join(agentDir, 'AGENT.md'), agentContent, 'utf8');
    console.log(`✅ Generated neutral rule file: .agent/AGENT.md`);

    // 기본 settings.json 설정 템플릿 생성 / Generate default settings.json configuration template
    const settingsPath = path.join(agentDir, 'settings.json');
    if (!fs.existsSync(settingsPath)) {
      const defaultSettings = {
        language: "ko",
        workspaceDir: "./.agent_workspace",
        reviewThreshold: 80,
        maxIterations: 3,
        enableOfflineMode: false
      };
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2), 'utf8');
      console.log(`✅ Generated default configuration template: .agent/settings.json`);
    }

    canUseAgentDir = true; // .agent 폴더 이용 가능 / .agent folder is available
  } catch (e) {
    console.error(`❌ Failed to create .agent directory or write setup files: ${e.message}`);
  }

  // 3. 각 에이전트/IDE에 대응하는 파일 쓰기 / Write corresponding rule file for each agent/IDE
  try {
    // 만일 .agent 폴더를 이용할 수 있는 경우 루트에 설치하는 설정을 후순위로 처리하여 .agent 폴더 내에 생성하고 루트 생성은 건너뜀
    // If the .agent folder is available, install config files inside .agent/ and make root installation a lower priority (omit or fallback)
    keepList.forEach((filename) => {
      if (canUseAgentDir) {
        // 1순위: .agent 폴더 내에 설치 / Priority 1: Install inside .agent/ folder
        const targetPath = path.join(agentDir, filename);
        fs.writeFileSync(targetPath, agentContent, 'utf8');
        console.log(`✅ Generated rule file inside .agent: .agent/${filename}`);
      } else {
        // 2순위 (후순위): .agent 폴더 이용이 불가능할 경우에만 fallback으로 루트에 설치 / Priority 2 (Fallback): Install in root only when .agent is unavailable
        const targetPath = path.join(rootDir, filename);
        fs.writeFileSync(targetPath, agentContent, 'utf8');
        console.log(`✅ Generated root rule file (fallback): ${filename}`);
      }
    });

    // Antigravity 특화 설정 / Special configuration for Antigravity
    if (selectedIde === 'antigravity') {
      fs.writeFileSync(path.join(agentDir, 'Antigravity.md'), agentContent, 'utf8');
      console.log(`✅ Generated rule file: .agent/Antigravity.md`);
    }

    // Hermes 특화 설정 (.agent/ 폴더 내에 Hermes.md 및 SOUL.md 생성) / Special configuration for Hermes (create Hermes.md and SOUL.md inside .agent/)
    if (selectedIde === 'hermes') {
      fs.writeFileSync(path.join(agentDir, 'Hermes.md'), agentContent, 'utf8');
      fs.writeFileSync(path.join(agentDir, 'SOUL.md'), agentContent, 'utf8');
      console.log(`✅ Generated rule files: .agent/Hermes.md, .agent/SOUL.md`);
    }

    // Codex 특화 설정 (.codex 디렉토리 및 내부에 AGENTS.md 추가 생성) / Special configuration for Codex (create .codex directory and AGENTS.md inside)
    if (selectedIde === 'codex') {
      const codexDir = path.join(rootDir, '.codex');
      if (!fs.existsSync(codexDir)) {
        fs.mkdirSync(codexDir, { recursive: true });
      }
      fs.writeFileSync(path.join(codexDir, 'AGENTS.md'), agentContent, 'utf8');
      console.log(`✅ Generated rule file: .codex/AGENTS.md`);
    }
  } catch (e) {
    console.error(`❌ Failed to write rule files for ${selectedIde}: ${e.message}`);
    return;
  }

  // 4. 활성화되지 않은 다른 규칙 파일 청소 / Clean up inactive rule files
  ALL_GENERATED_FILES.forEach((filename) => {
    // 만약 .agent 폴더를 사용할 수 있는 경우라면, 루트 경로에 있는 '모든' 생성 가능했던 규칙 파일들을 청소해야 함.
    // (이전에는 keepList에 있는 파일은 루트에 유지했었으나, 이제는 이 역시 .agent 내부로 들어갔으므로 루트에서 지워야 함)
    // If .agent directory is used, we should clean up all generated files from the root directory since they are now located in .agent/
    const shouldKeepInRoot = !canUseAgentDir && keepList.includes(filename);

    if (!shouldKeepInRoot) {
      const filePath = path.join(rootDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Deleted from root: ${filename}`);
        } catch (e) {
          console.error(`Failed to delete ${filename} from root: ${e.message}`);
        }
      }
    }
  });

  // 사용하지 않는 .codex 폴더 등 정리 / Clean up unused .codex directory, etc.
  if (selectedIde !== 'codex') {
    const codexDir = path.join(rootDir, '.codex');
    if (fs.existsSync(codexDir)) {
      try {
        fs.rmSync(codexDir, { recursive: true, force: true });
        console.log(`🗑️  Deleted: .codex/ directory`);
      } catch (e) {
        console.error(`Failed to delete .codex directory: ${e.message}`);
      }
    }
  }

  console.log('✨ Workspace is now perfectly optimized for your IDE!\n');
}

async function askUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🤖 [글타래로 (Geultaraero) Setup]');
  console.log('We could not automatically detect your AI IDE.');
  console.log('To clean up unnecessary rule files, please select your IDE:');
  console.log('1) Antigravity / Antigravity IDE');
  console.log('2) Claude Code');
  console.log('3) Open Code');
  console.log('4) Hermes Agent');
  console.log('5) Codex');
  console.log('6) Cursor');
  console.log('7) Windsurf');
  console.log('8) Cline');
  console.log('9) Other / Keep all');

  return new Promise((resolve) => {
    rl.question('\nEnter a number (1-9): ', (answer) => {
      rl.close();
      const choice = answer.trim();
      if (choice === '1') resolve('antigravity');
      else if (choice === '2') resolve('claude');
      else if (choice === '3') resolve('opencode');
      else if (choice === '4') resolve('hermes');
      else if (choice === '5') resolve('codex');
      else if (choice === '6') resolve('cursor');
      else if (choice === '7') resolve('windsurf');
      else if (choice === '8') resolve('cline');
      else resolve('keep_all');
    });
  });
}

async function main() {
  const detected = detectIDE();
  
  if (detected) {
    cleanupRules(detected);
  } else {
    // 자동으로 감지되지 않은 경우 사용자에게 질문 / If not automatically detected, prompt the user
    const choice = await askUser();
    if (choice === 'keep_all') {
      console.log('👍 Kept all rule files. Setup complete.\n');
    } else {
      cleanupRules(choice);
    }
  }
}

main();
