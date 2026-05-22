# 글타래로 (Geultaraero)

**마크다운 기반 다중 에이전트(Multi-Agent) 리포트 자동 작성 오케스트레이터**

> [Read in English (영어 버전)](README_EN.md)
>
> **Notice:** 본 프로젝트는 현재 Pre-release 단계입니다. 핵심 코어 아키텍처는 구현되었으나, 프롬프트 튜닝 및 부가 기능 업데이트가 진행 중입니다.

---

## 1. 개요 (Overview)
글타래로 (Geultaraero)는 대표, 탐색가, 작성가, 검토가, 교정가, 포맷터 등 5개의 독립된 AI 페르소나가 상호작용하여 마크다운 포맷의 보고서를 자동 작성 및 검토하는 오케스트레이션 시스템입니다. 본 도구는 특히 한국어 문서 제작 환경 및 한국어 마크다운 서식 최적화에 맞추어 설계되었습니다.

---

## 2. 설치 및 설정 (Installation & Setup)

글타래로 (Geultaraero)는 사용 환경에 따라 최적의 설치 방식을 지원합니다. 호스트 에이전트(Antigravity, Cursor, Claude Code 등)의 채팅 패널에 아래의 프롬프트 중 하나를 복사하여 붙여넣으면 설치가 자동 진행됩니다.

### 📋 AI 에이전트용 복사/붙여넣기 설치 프롬프트

#### 1️⃣ Option 1: 풀 코어 전체 자동 설치 (CLI 엔진 및 설정 일괄 구성)
> Node.js CLI 엔진(`glro`) 또는 독립 실행형 바이너리를 컴퓨터에 구축하고, 이에 연동되는 에이전트 규칙 파일들까지 일괄 자동 구성하고자 하는 경우에 사용합니다.
```text
Install and configure the full Geultaraero system (including Node.js/binary installation and rule files setup) by following Part 1 (Priority 1) of the instructions here:
https://raw.githubusercontent.com/WizMasia/Geultaraero/refs/heads/main/docs/AGENT_SETUP_GUIDE.md
```

#### 2️⃣ Option 2: 무설치형 룰셋 단독 구성 (에이전트 규칙 파일만 세팅)
> 별도의 Node.js 설치나 바이너리 파일 복사 없이, 순수하게 AI 에이전트가 개발 업무를 돕기 위한 룰셋(`.agent/` 폴더 및 전용 규칙 파일)만 워크스페이스 내에 즉시 구축하려는 경우에 사용합니다.
```text
Configure the Geultaraero system using the zero-dependency Agent-Only Mode (Priority 2) by following the instructions here:
https://raw.githubusercontent.com/WizMasia/Geultaraero/refs/heads/main/docs/AGENT_SETUP_GUIDE.md
Create the .agent/ directory and setup only the rule files for my AI IDE without installing any Node.js packages or binaries.
```

---

### 수동 설치 (Manual Setup)

**[macOS / Linux]**
```bash
curl -fsSL https://raw.githubusercontent.com/WizMasia/Geultaraero/main/install.sh | bash
```
> **Smart Cleanup:** 설치 스크립트 실행 시 사용 중인 터미널 환경을 분석하여 현재 IDE에 맞는 설정 파일 1개만 남기고 불필요한 규칙 파일들을 정리하며, 프로젝트 내 `.agent/` 폴더를 생성하여 공통 에이전트 설정(`AGENT.md`) 및 동작 세부 조율을 위한 `settings.json`을 자동 구축합니다.

**[Windows]**
[Releases 페이지](https://github.com/WizMasia/Geultaraero/releases)에서 사전 컴파일된 `.exe` 바이너리를 다운로드하여 실행하고 환경 변수(Path)에 추가하는 것을 권장합니다.

---

## 3. 주요 특징 (Key Features)

- **Offline Survival Mode (망 분리 환경 지원):** 네트워크 연결이 단절되거나 외부 검색이 불가한 경우, 웹 검색을 중단하고 로컬 `input_materials/` 디렉토리 내의 문서를 기반으로 보고서 작성을 이어 나갑니다.
- **sLM Memory Optimization (Rolling Summary):** 로컬 모델 및 컨텍스트 한도가 제한된 환경을 위해 방대한 문서를 챕터 단위로 분할(Chunking)하고, 압축 요약(Rolling Summary)하여 메모리 초과(OOM)를 방지합니다.
- **Pre-Flight Interview & Planning UX:** 작업 개시 전 사용자와 인터뷰를 통해 요구사항을 구체화하고, 대표(Representative) 에이전트가 "자료 조사 및 보고서 구조 계획서(Research & Structure Plan)"를 기획하여 사용자 승인을 거친 뒤 조사를 개시합니다.
- **Auto-Tooling (의존성 자동 설치):** 작업 수행에 필요한 외부 파서나 패키지가 누락된 경우, 에이전트가 자체적으로 환경을 분석하고 필수 도구를 자동으로 설치합니다.
- **Score-based Loopback (환류 제어):** 검토가(Reviewer) 페르소나가 결과물에 부여한 점수가 기준점(80점) 미달일 경우, 시스템이 이전 단계로 피드백을 전달하여 재작업을 강제합니다.

---

## 4. 로컬 자료 분석 기능 (`input_materials/`)

글타래로 (Geultaraero)는 로컬 데이터 처리에 최적화되어 있습니다. 작업 루트 디렉토리에 `input_materials/` 폴더를 생성하고 참고 문서를 배치하면 에이전트가 이를 최우선으로 분석합니다.

- **HWP/HWPX:** 전용 파서를 자동 다운로드하여 텍스트를 추출합니다.
- **PDF & Image:** 텍스트 추출이 불가능한 이미지형 문서의 경우, 이미지를 분할(`pdf2image`)하고 OCR(`tesseract`)을 통해 변환하며, 필요시 Vision 모델을 통해 이미지를 직접 분석합니다.
- **DOCX/XLSX:** 텍스트 및 표 데이터를 구조화하여 완벽한 마크다운 서식으로 변환합니다.

---

## 5. 아키텍처 (Architecture)

### 5.1 Full-CLI Mode (비동기 멀티 에이전트 구조)
TypeScript 기반의 CLI 런타임 엔진(`glro`)이 마크다운 기반의 상태 파일(`.agent_workspace/`)을 통해 호스트 IDE와 통신합니다. 독립된 페르소나들이 각자의 지시서(`instruction.md`)에 따라 비동기적으로 작업을 수행하며, 엔진이 전체 상태를 조율합니다.

### 5.2 Config-Only Mode (단일 롤플레잉 구조)
외부 CLI 런타임 없이 `AGENT.md`(사용자의 IDE 규칙 파일명으로 복사/연동됨) 및 `settings.json` 프롬프트 파일만을 활용하여 워크플로우를 구성합니다. 내장 에이전트가 단일 컨텍스트 내에서 순차적으로 역할을 변경하며 작업을 완수합니다.

---

## 6. 설정 제어 (Configuration)

시스템의 정적 워크플로우 및 에이전트 페르소나는 `orchestration-config.yaml` 파일로 제어되며, 사용자가 동작 방식을 실시간으로 세부 조율(Fine-tuning)할 수 있는 동적 설정은 `settings.json` 파일을 통해 병합 적용됩니다.

### 6.1. settings.json (동적 사용자 설정)
`.agent/settings.json` 또는 루트 `settings.json` 파일에 아래와 같은 JSON 값을 기입하여 에이전트 동작을 쉽게 조율할 수 있습니다.

```json
{
  "language": "ko",                // 기본 출력 언어 ("ko" | "en")
  "workspaceDir": "./.workspace",  // 에이전트 작업 공간 경로
  "reviewThreshold": 80,           // 검토 통과 기준 점수 (0 ~ 100)
  "maxIterations": 3,              // 피드백 루프 최대 반복 횟수
  "enableOfflineMode": false,      // 오프라인 서바이벌 모드 활성화 여부 (boolean)
  "exportDir": "./export",         // 최종 완성 보고서가 저장되는 폴더 경로 (string)
  "generateWorkSummary": false     // 에이전트 간 작업 내역 요약보고서 자동 생성 여부 (boolean)
}
```

* **`exportDir`**: 작업이 모두 성공적으로 끝난 후, 최종 마크다운 및 포맷 보고서가 복사 및 보존되는 물리 경로입니다.
* **`generateWorkSummary`**: `true`일 경우 모든 에이전트가 주고받은 지시/피드백 및 최종 완료 상태 요약 본문들을 자동으로 하나의 요약문(`[보고서명]_summary.md`)으로 정리하여 `exportDir`에 생성합니다. `false`일 때는 워크플로우 완료 단계에서 대표 에이전트(`Representative`)가 사용자에게 직접 요약본을 추가 생성할지 채팅을 통해 물어보며 수동 지시를 받습니다.

### 6.2. orchestration-config.yaml (정적 워크플로우)
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

## 7. 삭제 가이드 (Uninstallation)

터미널에서 다음 명령어를 실행하여 전역 패키지 및 워크스페이스를 깨끗하게 제거합니다.

```bash
npm rm -g geultaraero
rm -rf ~/.geultaraero
```

---

## 8. 기여 안내 (Contribution)
글타래로 (Geultaraero)는 오픈소스 프로젝트입니다. 버그 리포트 및 Pull Request를 통한 기여를 적극적으로 환영합니다.
