import { getRhwpBinaryPath, runRhwpCommand } from '../rhwp-runner';
import { BinaryResolver } from '../binary-resolver';
import * as path from 'path';

describe('rhwp-runner tests / rhwp-runner 테스트', () => {
  it('should resolve binary path correctly based on platform / 플랫폼별로 바이너리 경로를 올바르게 결정해야 함', () => {
    const binPath = getRhwpBinaryPath();
    expect(binPath).toContain('bin');
  });

  it('should fail cleanly if binary is not found / 바이너리가 없을 경우 정상적으로 에러를 발생시켜야 함', async () => {
    // Mock BinaryResolver.resolve to return null so it simulates a missing binary environment
    // 바이너리 부재 환경을 시뮬레이션하기 위해 BinaryResolver.resolve가 null을 반환하도록 모킹합니다.
    const spy = jest.spyOn(BinaryResolver, 'resolve').mockReturnValue(null);
    try {
      await expect(runRhwpCommand(['--version'])).rejects.toThrow('rhwp binary not found');
    } finally {
      spy.mockRestore();
    }
  });
});
