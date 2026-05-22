import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

// 사용자가 조율할 수 있는 외부 설정 파일 인터페이스 / Interface for external configuration files adjustable by users
export interface UserSettings {
  language?: string;
  workspaceDir?: string;
  reviewThreshold?: number;
  maxIterations?: number;
  enableOfflineMode?: boolean;
  exportDir?: string;
  generateWorkSummary?: boolean;
  [key: string]: any;
}

export interface AgentConfig {
  id: string;
  role: 'representative' | 'explorer' | 'writer' | 'reviewer' | 'editor' | 'formatter';
  persona: string;
  [key: string]: any;
}

export interface StepConfig {
  step: number;
  type: 'parallel' | 'sequential' | 'feedback_loop';
  agents: string[];
  max_iterations?: number;
  threshold_score?: number;
  output_dir?: string;
}

export interface OrchestrationConfig {
  version: string;
  global_settings: {
    workspace_dir: string;
    language: string;
    export_dir?: string;
    generate_work_summary?: boolean;
    [key: string]: any;
  };
  agents: AgentConfig[];
  workflow: StepConfig[];
}

export class ConfigParser {
  /**
   * YAML 설정 파일을 파싱하고 외부 settings.json 설정을 탐색 및 병합하여 검증된 설정 객체를 반환합니다.
   * Parses the YAML config file, searches/merges external settings.json, and returns the validated config object.
   * @param filePath 설정 파일 경로 / Configuration file path
   */
  public static parse(filePath: string): OrchestrationConfig {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found at ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const config = yaml.load(fileContent) as OrchestrationConfig;

    // 외부 settings.json 설정 병합 / Merge external settings.json configuration
    const mergedConfig = this.mergeUserSettings(config);

    this.validate(mergedConfig);
    return mergedConfig;
  }

  /**
   * settings.json 또는 .agent/settings.json 설정 파일이 존재할 경우 설정을 기본 YAML 구조에 덮어씁니다.
   * If settings.json or .agent/settings.json exists, overrides the configuration in the default YAML structure.
   */
  private static mergeUserSettings(config: OrchestrationConfig): OrchestrationConfig {
    const rootDir = process.cwd();
    const agentSettingsPath = path.join(rootDir, '.agent', 'settings.json');
    const rootSettingsPath = path.join(rootDir, 'settings.json');

    let settingsPath: string | null = null;
    if (fs.existsSync(agentSettingsPath)) {
      settingsPath = agentSettingsPath;
    } else if (fs.existsSync(rootSettingsPath)) {
      settingsPath = rootSettingsPath;
    }

    if (!settingsPath) {
      return config; // 설정 파일이 없으면 기존 설정 반환 / If no settings file, return original configuration
    }

    try {
      console.log(`ℹ️ Loading user settings from: ${settingsPath}`);
      const settingsContent = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(settingsContent) as UserSettings;

      // 1. global_settings 속성 병합 / Merge global_settings properties
      if (settings.language) {
        config.global_settings.language = settings.language;
      }
      if (settings.workspaceDir) {
        config.global_settings.workspace_dir = settings.workspaceDir;
      }
      if (settings.enableOfflineMode !== undefined) {
        config.global_settings.enable_offline_mode = settings.enableOfflineMode;
      }
      if (settings.exportDir) {
        config.global_settings.export_dir = settings.exportDir;
      }
      if (settings.generateWorkSummary !== undefined) {
        config.global_settings.generate_work_summary = settings.generateWorkSummary;
      }

      // 2. workflow의 피드백 루프 단계 설정 오버라이드 / Override feedback loop step configurations in the workflow
      if (config.workflow && Array.isArray(config.workflow)) {
        config.workflow.forEach((step) => {
          if (settings.reviewThreshold !== undefined && step.type === 'feedback_loop') {
            step.threshold_score = settings.reviewThreshold;
          }
          if (settings.maxIterations !== undefined && step.type === 'feedback_loop') {
            step.max_iterations = settings.maxIterations;
          }
        });
      }

      console.log(`✅ Successfully merged user settings from settings.json`);
    } catch (e: any) {
      console.error(`⚠️ Failed to parse or merge settings.json: ${e.message}`);
    }

    return config;
  }

  private static validate(config: OrchestrationConfig): void {
    if (!config.version) throw new Error("Missing 'version' in config.");
    if (!config.global_settings?.workspace_dir) throw new Error("Missing 'workspace_dir' in global_settings.");
    if (!config.agents || !Array.isArray(config.agents) || config.agents.length === 0) {
      throw new Error("Missing or empty 'agents' array.");
    }
    if (!config.workflow || !Array.isArray(config.workflow) || config.workflow.length === 0) {
      throw new Error("Missing or empty 'workflow' array.");
    }

    // 대표 에이전트가 1명 이상 있는지 확인 (선택적일 수도 있지만 권장) / Check if at least one representative agent exists (recommended)
    const hasRepresentative = config.agents.some(a => a.role === 'representative');
    if (!hasRepresentative) {
      console.warn("Warning: No representative agent found in config. User feedback loop might not work properly.");
    }
  }
}
