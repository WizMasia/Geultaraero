#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { ConfigParser } from './parser';
import { WorkflowEngine } from './engine';
import { Logger } from './utils/logger';

async function main() {
  Logger.info('Initializing Agentic Report Writing Supporter CLI...');

  // 1. 설정 파일 경로 확인 (인자로 받거나 기본값)
  const args = process.argv.slice(2);
  const configPath = args[0] ? path.resolve(args[0]) : path.resolve(process.cwd(), 'orchestration-config.yaml');

  if (!fs.existsSync(configPath)) {
    Logger.error(`Config file not found at ${configPath}`);
    Logger.info('Usage: report-writer [path/to/config.yaml]');
    process.exit(1);
  }

  try {
    // 2. 파서를 통해 설정 로드 및 검증
    Logger.info(`Loading configuration from ${configPath}...`);
    const config = ConfigParser.parse(configPath);

    // 3. 워크스페이스 디렉토리 준비
    const workspaceDir = path.resolve(process.cwd(), config.global_settings.workspace_dir);
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
      Logger.info(`Created workspace directory at ${workspaceDir}`);
    }

    // 4. 엔진 구동
    const engine = new WorkflowEngine(config);
    await engine.run();

  } catch (error: any) {
    Logger.error(`Fatal Error: ${error.message}`);
    process.exit(1);
  }
}

main();
