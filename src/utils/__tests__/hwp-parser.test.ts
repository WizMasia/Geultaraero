import { parseHwp, parseHwpx } from '../hwp-parser';
import * as fs from 'fs';
import * as path from 'path';
import { zip } from '../zip-helper';

describe('hwp-parser tests / hwp-parser 테스트', () => {
  const dummyHwpxPath = path.join(__dirname, 'dummy_test.hwpx');
  const tempDir = path.join(__dirname, 'temp_dummy');

  beforeAll(async () => {
    // Generate a minimal dummy HWPX file directory structure
    // zip 파싱 테스트를 위한 최소화된 더미 HWPX 디렉토리를 생성합니다.
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const contentsDir = path.join(tempDir, 'Contents');
    if (!fs.existsSync(contentsDir)) {
      fs.mkdirSync(contentsDir, { recursive: true });
    }

    const sectionXml = `<?xml version="1.0" encoding="utf-8"?>
<hp:section xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hp:pList>
    <hp:p><hp:run><hp:t>안녕하세요. 글타래로 테스트 문서입니다.</hp:t></hp:run></hp:p>
    <hp:p><hp:run><hp:t>두 번째 문단입니다.</hp:t></hp:run></hp:p>
  </hp:pList>
</hp:section>`;
    
    fs.writeFileSync(path.join(contentsDir, 'section0.xml'), sectionXml, 'utf-8');
    // Zip it using our helper
    await zip(tempDir, dummyHwpxPath);
  });

  afterAll(() => {
    if (fs.existsSync(dummyHwpxPath)) {
      fs.unlinkSync(dummyHwpxPath);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should fail if file does not exist / 파일이 없을 경우 에러를 던져야 함', async () => {
    await expect(parseHwp('non_existent_file.hwp')).rejects.toThrow('File not found');
    await expect(parseHwpx('non_existent_file.hwpx')).rejects.toThrow('File not found');
  });

  it('should parse hwpx text cleanly using native zip logic / 네이티브 zip 로직을 사용하여 HWPX 텍스트를 깨끗하게 추출해야 함', async () => {
    const text = await parseHwpx(dummyHwpxPath);
    expect(text).toContain('안녕하세요. 글타래로 테스트 문서입니다.');
    expect(text).toContain('두 번째 문단입니다.');
  });
});

import { ParserFactory } from '../document-parser';
import { HwpParser } from '../hwp-parser';

describe('HwpParser via Factory integration / 팩토리 연동 테스트', () => {
  beforeAll(() => {
    ParserFactory.registerParser(new HwpParser());
  });

  it('should be registered to factory and support .hwp and .hwpx / 팩토리에 등록되어 HWP/HWPX를 처리해야 함', () => {
    const parser = ParserFactory.getParser('dummy.hwp');
    expect(parser).toBeInstanceOf(HwpParser);
    expect(parser.supportedExtensions).toContain('.hwp');
    expect(parser.supportedExtensions).toContain('.hwpx');
  });
});

