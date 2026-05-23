import * as fs from 'fs';
import * as path from 'path';
import { zip, unzip } from './zip-helper';

/**
 * Generates an HWPX file from a template by replacing Content/section0.xml with the given content.
 * 주어진 본문 내용을 사용하여 HWPX 템플릿으로부터 HWPX 파일을 생성합니다.
 * @param outputPath 생성될 HWPX 파일의 경로 / Output path of the generated HWPX file
 * @param content 문서에 들어갈 본문 텍스트 / Text content for the document
 */
export async function createHwpxFromTemplate(outputPath: string, content: string): Promise<void> {
  const absoluteOut = path.resolve(outputPath);
  const templateDir = path.join(process.cwd(), 'resources', 'templates');
  const templatePath = path.join(templateDir, 'base.hwpx');

  // Ensure the base template exists
  // 기본 템플릿 파일이 존재하지 않는 경우 새로 만듭니다.
  if (!fs.existsSync(templatePath)) {
    await ensureBaseTemplate(templatePath);
  }

  // Create temporary extraction directory within workspace
  // 워크스페이스 내에 임시 압축 해제 폴더를 생성합니다.
  const tempDirName = `tmp_hwpx_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const tempExtractPath = path.join(process.cwd(), '.agent_workspace', 'temp', tempDirName);

  try {
    // Unzip the base template to the temp directory
    // 기본 템플릿의 압축을 임시 폴더에 해제합니다.
    await unzip(templatePath, tempExtractPath);

    // Escape and transform raw text into XML paragraphs
    // 일반 텍스트를 이스케이프하고 XML 문단 태그로 변환합니다.
    const paragraphs = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `    <hp:p><hp:run><hp:t>${escapeXml(line)}</hp:t></hp:run></hp:p>`)
      .join('\n');

    const sectionXml = `<?xml version="1.0" encoding="utf-8"?>
<hp:section xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core">
  <hp:pList>
${paragraphs}
  </hp:pList>
</hp:section>`;

    // Ensure Contents directory exists in temp
    // 임시 폴더 내의 Contents 디렉토리가 존재하는지 확인합니다.
    const contentsDir = path.join(tempExtractPath, 'Contents');
    if (!fs.existsSync(contentsDir)) {
      fs.mkdirSync(contentsDir, { recursive: true });
    }

    // Overwrite section0.xml with the generated XML content
    // section0.xml 파일을 새로 생성된 XML 본문 내용으로 덮어씁니다.
    fs.writeFileSync(path.join(contentsDir, 'section0.xml'), sectionXml, 'utf-8');

    // Repack temp directory back into the target HWPX zip package
    // 임시 폴더의 내용물을 대상 HWPX zip 패키지로 재압축합니다.
    await zip(tempExtractPath, absoluteOut);
  } catch (error: any) {
    throw new Error(`Failed to generate HWPX from template: ${error.message}`);
  } finally {
    // Cleanup the temporary directory
    // 임시 디렉토리를 정리합니다.
    if (fs.existsSync(tempExtractPath)) {
      try {
        fs.rmSync(tempExtractPath, { recursive: true, force: true });
      } catch (cleanupError) {
        // Suppress cleanup issues
      }
    }
  }
}

/**
 * Escapes special XML characters in string.
 * 문자열 내의 XML 특수 문자를 이스케이프 처리합니다.
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Ensures the existence of the base HWPX template, creating it if missing.
 * 기본 HWPX 템플릿 파일이 없는 경우 생성합니다.
 */
async function ensureBaseTemplate(templatePath: string): Promise<void> {
  const templateDir = path.dirname(templatePath);
  if (!fs.existsSync(templateDir)) {
    fs.mkdirSync(templateDir, { recursive: true });
  }

  // Create temporary structure directory
  // 템플릿 생성을 위한 임시 구조 폴더를 만듭니다.
  const tempDirName = `tmp_base_tmpl_${Date.now()}`;
  const tempStructurePath = path.join(process.cwd(), '.agent_workspace', 'temp', tempDirName);
  
  try {
    fs.mkdirSync(tempStructurePath, { recursive: true });

    // HWPX mimetype standard is application/hwp+zip
    // HWPX mimetype 표준 규격인 application/hwp+zip을 작성합니다.
    fs.writeFileSync(path.join(tempStructurePath, 'mimetype'), 'application/hwp+zip', 'utf-8');

    const contentsDir = path.join(tempStructurePath, 'Contents');
    fs.mkdirSync(contentsDir, { recursive: true });

    // Minimal content.hpf manifest
    // 최소한의 content.hpf 매니페스트를 작성합니다.
    const contentHpf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Generated Document</dc:title>
  </metadata>
  <manifest>
    <item id="section0" href="Contents/section0.xml" media-type="application/xml"/>
  </manifest>
</package>`;
    fs.writeFileSync(path.join(contentsDir, 'content.hpf'), contentHpf, 'utf-8');

    // Default empty section0.xml
    // 기본 빈 본문 section0.xml을 작성합니다.
    const sectionXml = `<?xml version="1.0" encoding="utf-8"?>
<hp:section xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hp:pList>
    <hp:p><hp:run><hp:t>Placeholder</hp:t></hp:run></hp:p>
  </hp:pList>
</hp:section>`;
    fs.writeFileSync(path.join(contentsDir, 'section0.xml'), sectionXml, 'utf-8');

    // Pack into the template path
    // 템플릿 경로로 압축 패키징합니다.
    await zip(tempStructurePath, templatePath);
  } finally {
    // Cleanup temporary structure folder
    // 임시 폴더 구조를 삭제합니다.
    if (fs.existsSync(tempStructurePath)) {
      try {
        fs.rmSync(tempStructurePath, { recursive: true, force: true });
      } catch (e) {
        // Suppress cleanup issues
      }
    }
  }
}
