import { createHwpxFromTemplate } from '../hwp-generator';
import { parseHwpx } from '../hwp-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('hwp-generator tests / hwp-generator 테스트', () => {
  const outPath = path.join(__dirname, 'test_out.hwpx');

  afterEach(() => {
    if (fs.existsSync(outPath)) {
      try {
        fs.unlinkSync(outPath);
      } catch (e) {
        // Ignore file cleanup issues if not exists
      }
    }
  });

  it('should generate a valid hwpx file and recover its text / 유효한 hwpx 파일을 생성하고 텍스트를 복원할 수 있어야 함', async () => {
    const testContent = '안녕하세요. 글타래로 생성기 테스트 문서입니다.\n두 번째 줄입니다.';
    
    // Generate HWPX using template generator
    // 템플릿 생성기를 사용해 HWPX 파일을 생성합니다.
    await createHwpxFromTemplate(outPath, testContent);
    expect(fs.existsSync(outPath)).toBe(true);

    // Verify content using our parser
    // 작성된 파서를 사용하여 생성된 문서의 내용이 일치하는지 확인합니다.
    const parsedText = await parseHwpx(outPath);
    expect(parsedText).toContain('안녕하세요. 글타래로 생성기 테스트 문서입니다.');
    expect(parsedText).toContain('두 번째 줄입니다.');
  });
});
