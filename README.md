# 글타래로 (Geultaraero)

**마크다운 기반 다중 에이전트(Multi-Agent) 리포트 자동 작성 오케스트레이터**

> **Notice:** 본 프로젝트는 현재 Pre-release 단계입니다. 핵심 코어 아키텍처는 구현되었으나, 프롬프트 튜닝 및 부가 기능 업데이트가 진행 중입니다.

---

## 1. Overview
글타래로 (Geultaraero)는 대표, 탐색가, 작성가, 검토가, 교정가, 포맷터 등 5개의 독립된 AI 페르소나가 상호작용하여 마크다운 포맷의 보고서를 자동 작성 및 검토하는 오케스트레이션 시스템입니다. 

---

## 2. Installation & Setup

글타래로 (Geultaraero)는 환경에 따라 두 가지 설치/배포 옵션을 제공합니다.

### Option 1: Agent-Native Mode (권장)
별도의 Node.js 환경이나 런타임 설치 없이, IDE 내장 에이전트를 활용하여 구동하는 방식입니다.

1. 빈 프로젝트 디렉토리를 생성합니다.
2. 본 저장소의 `.cursorrules` (또는 `CLAUDE.md`) 파일을 복사하여 루트 디렉토리에 배치합니다.
3. 호스트 에이전트를 호출하여 작업을 지시합니다. 에이전트가 단독으로 탐색, 작성, 검토 과정을 순차적으로 수행합니다.
*(참고: 에이전트는 설정된 샌드박스 정책에 따라 현재 작업 디렉토리 외부의 파일에 접근하지 않습니다.)*

#### [Antigravity IDE 구동 예시]
1. Antigravity IDE에서 빈 워크스페이스를 오픈합니다.
2. 루트 경로에 `.cursorrules` 파일을 위치시킵니다. (Antigravity는 해당 글로벌 룰 파일을 자동으로 인식합니다.)
3. 채팅 패널에서 *"보고서 작성을 시작해 줘"* 라고 입력하면, 시스템이 룰을 상속받아 자동으로 오케스트레이션을 진행합니다.

### Option 2: Node.js Orchestration Mode (Advanced)
다중 페르소나의 병렬 처리 통제 및 세밀한 런타임 제어가 필요한 경우 CLI 엔진을 설치하여 구동합니다.

호스트 에이전트(Antigravity, Cursor 등)에 다음 프롬프트를 입력하여 설치를 자동화할 수 있습니다:
```text
Install and configure Geultaraero by following the instructions here:
https://raw.githubusercontent.com/WizMasia/Geultaraero/refs/heads/main/docs/AGENT_SETUP_GUIDE.md
```

#### 수동 설치 (Manual Setup)
**[macOS / Linux]**
```bash
curl -fsSL https://raw.githubusercontent.com/WizMasia/Geultaraero/main/install.sh | bash
```
> **Smart Cleanup:** 설치 스크립트는 실행 중인 터미널 환경을 분석하여 현재 사용 중인 IDE(Cursor, Windsurf 등)에 해당하는 설정 파일 1개만 남기고 불필요한 룰 파일들을 자동 삭제합니다.

**[Windows]**
[Releases 페이지](https://github.com/WizMasia/Geultaraero/releases)에서 사전 컴파일된 `.exe` 바이너리를 다운로드하여 실행하는 것을 권장합니다.

---

## 3. Key Features

- **Offline Survival Mode (망 분리 환경 지원):** 네트워크 연결이 단절되거나 외부 검색이 불가한 경우, 웹 검색을 중단하고 로컬 `input_materials/` 디렉토리 내의 문서를 기반으로 작업을 수행합니다.
- **sLM Memory Optimization (Rolling Summary):** 로컬 모델 및 컨텍스트 한도가 제한된 환경을 위해 방대한 문서를 챕터 단위로 분할(Chunking)하고, 압축 요약(Rolling Summary)하여 메모리 초과를 방지합니다.
- **Pre-Flight Interview UX:** 작업 개시 전 사용자에게 문서의 주제, 요구 포맷, 제약 조건 등을 사전 질의하여 요구사항을 구체화합니다.
- **Auto-Tooling (의존성 자동 설치):** 작업 수행에 필요한 외부 파서나 패키지가 누락된 경우, 에이전트가 자체적으로 환경을 분석하고 필수 도구를 설치합니다.
- **Score-based Loopback:** 검토가(Reviewer) 페르소나가 결과물에 부여한 점수가 기준점(80점) 미달일 경우, 시스템이 이전 단계로 피드백을 전달하여 재작업을 강제합니다.

---

## 4. Local Resource Parsing (`input_materials/`)

글타래로 (Geultaraero)는 로컬 데이터 처리에 최적화되어 있습니다. 작업 루트 디렉토리에 `input_materials/` 폴더를 생성하고 참고 문서를 배치하면 에이전트가 이를 최우선으로 분석합니다.

- **HWP/HWPX:** 파서를 자동 다운로드하여 텍스트를 추출합니다.
- **PDF & Image:** 텍스트 추출이 불가능한 문서의 경우, 이미지를 분할(`pdf2image`)하고 OCR(`tesseract`)을 통해 변환하며, 필요시 Vision 모델을 통해 이미지를 직접 분석합니다.
- **DOCX/XLSX:** 텍스트 및 표 데이터를 구조화하여 분석합니다.

---

## 5. Architecture

### 5.1 Config-Only Mode (단일 롤플레잉 구조)
외부 CLI 런타임 없이 `.cursorrules` (또는 `CLAUDE.md`) 프롬프트 파일만을 활용하여 워크플로우를 구성합니다. 내장 에이전트가 단일 컨텍스트 내에서 순차적으로 역할을 변경하며 작업을 완수합니다.

### 5.2 Full-CLI Mode (비동기 멀티 에이전트 구조)
TypeScript 기반의 CLI 런타임 엔진(`glro`)이 마크다운 기반의 상태 파일(`.agent_workspace/`)을 통해 호스트 IDE와 통신합니다. 독립된 페르소나들이 각자의 지시서(`instruction.md`)에 따라 비동기적으로 작업을 수행하며, 엔진이 전체 상태를 조율합니다.

---

## 6. Configuration

시스템의 워크플로우 및 에이전트 페르소나는 `orchestration-config.yaml` 파일로 제어됩니다.

```yaml
version: "1.0"
global_settings:
  workspace_dir: "./.agent_workspace"
agents:
  - id: "rep-01"
    role: "representative"
    persona: "전문 기획자"
```

---

## 7. Uninstallation

터미널에서 다음 명령어를 실행하여 전역 패키지 및 워크스페이스를 제거합니다.

```bash
npm rm -g geultaraero
rm -rf ~/.geultaraero
```

---

## 8. Contribution
글타래로 (Geultaraero)는 오픈소스 프로젝트입니다. 버그 리포트 및 Pull Request를 통한 기여를 환영합니다.
