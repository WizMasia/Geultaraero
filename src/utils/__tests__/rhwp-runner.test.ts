import { getRhwpBinaryPath, runRhwpCommand } from '../rhwp-runner';
import * as path from 'path';

describe('rhwp-runner tests / rhwp-runner 테스트', () => {
  it('should resolve binary path correctly based on platform / 플랫폼별로 바이너리 경로를 올바르게 결정해야 함', () => {
    const binPath = getRhwpBinaryPath();
    expect(binPath).toContain('bin');
  });

  it('should fail cleanly if binary is not found / 바이너리가 없을 경우 정상적으로 에러를 발생시켜야 함', async () => {
    // We expect runRhwpCommand to fail since we haven't placed the binary yet
    // 아직 바이너리를 배치하지 않았으므로 에러가 날 것을 기대합니다.
    await expect(runRhwpCommand(['--version'])).rejects.toThrow('rhwp binary not found');
  });
});
