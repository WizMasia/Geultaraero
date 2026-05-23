import { ImageParser } from '../image-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('ImageParser tests / 이미지 파서 테스트', () => {
  let dummyImagePath: string;

  beforeAll(() => {
    dummyImagePath = path.join(__dirname, 'dummy_test_image.png');
    fs.writeFileSync(dummyImagePath, 'dummy png content');
  });

  afterAll(() => {
    if (fs.existsSync(dummyImagePath)) {
      fs.unlinkSync(dummyImagePath);
    }
  });

  it('should resolve fallback offline error message if vision API is disabled and offline mode is on / 오프라인 모드일 시 폴백 예외를 반환해야 함', async () => {
    const parser = new ImageParser({ enableOfflineMode: true });
    await expect(parser.parse(dummyImagePath)).rejects.toThrow('Image parsing is limited in offline survival mode');
  });
});
