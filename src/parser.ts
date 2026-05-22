import * as yaml from 'js-yaml';
import * as fs from 'fs';

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
  };
  agents: AgentConfig[];
  workflow: StepConfig[];
}

export class ConfigParser {
  /**
   * YAML 설정 파일을 파싱하여 검증된 설정 객체를 반환합니다.
   * @param filePath 설정 파일 경로
   */
  public static parse(filePath: string): OrchestrationConfig {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found at ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const config = yaml.load(fileContent) as OrchestrationConfig;

    this.validate(config);
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

    // 대표 에이전트가 1명 이상 있는지 확인 (선택적일 수도 있지만 권장)
    const hasRepresentative = config.agents.some(a => a.role === 'representative');
    if (!hasRepresentative) {
      console.warn("Warning: No representative agent found in config. User feedback loop might not work properly.");
    }
  }
}
