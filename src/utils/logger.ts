export class Logger {
  public static info(message: string): void {
    console.log(`\x1b[34m[INFO]\x1b[0m ${message}`);
  }

  public static success(message: string): void {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
  }

  public static warn(message: string): void {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`);
  }

  public static error(message: string): void {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
  }

  public static agent(agentId: string, message: string): void {
    console.log(`\x1b[36m[AGENT: ${agentId}]\x1b[0m ${message}`);
  }
}
