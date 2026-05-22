<div align="center">
  <h1>🚀 WizWriting Supporter</h1>
  <p><b>마크다운 기반의 다중 에이전트(Multi-Agent) 리포트 자동 작성 오케스트레이터</b></p>
</div>

> [!WARNING]
> 🚧 **현재 활발히 개발 중인 프로젝트입니다 (Pre-release Phase)** 🚧  
> 핵심 코어 아키텍처는 완성되었으나, 세부 에이전트 프롬프트 튜닝 및 부가 기능들이 지속적으로 업데이트되고 있습니다. 예상치 못한 버그가 발생할 수 있으며, 배포된 바이너리는 `Pre-release` 목적으로 제공됩니다.

---

## 💡 Overview
WizWriting Supporter는 단순한 자동화 스크립트가 아닙니다. **대표, 탐색가, 작성가, 검토가, 교정가, 포맷터**로 구성된 5개의 독립된 AI 페르소나가 상호작용하며 높은 품질의 마크다운 보고서를 자동으로 작성하고 검토하는 오케스트레이션 시스템입니다. 

---

## ⚡ Quick Install (이제 터미널을 열지 마세요)
설정 파일을 복사하고 스크립트를 타이핑하다가 오타를 내는 시대는 지났습니다. 
**진심으로, 에이전트한테 시키세요.** 어차피 이 툴은 에이전트와 함께 쓰는 시스템입니다!

### 🤖 LLM 에이전트를 위한 설치 (Recommended)
이 프롬프트를 당신의 호스트 에이전트(Antigravity, Cursor, Claude Code 등)의 채팅창에 그대로 붙여넣으세요:

```text
Install and configure WizWriting Supporter by following the instructions here:
https://raw.githubusercontent.com/WizMasia/WizWriting_Supporter/refs/heads/main/docs/AGENT_SETUP_GUIDE.md
```
에이전트가 알아서 문서를 읽고 당신의 환경에 완벽하게 `agentic-writer` 명령어를 세팅해 줄 것입니다. 당신은 팝콘이나 튀기며 기다리면 됩니다. 🍿

### 👨‍💻 사람을 위한 수동 설치 (Manual Option)
에이전트를 못 믿으시겠다면... `oh-my-zsh` 처럼 터미널에 아래 스크립트 한 줄만 복사해서 붙여넣으세요.

```bash
curl -fsSL https://raw.githubusercontent.com/WizMasia/WizWriting_Supporter/main/install.sh | bash
```

> [!TIP]
> **Node.js가 설치되어 있지 않나요?**
> 설치 스크립트가 실행되려면 Node.js가 필요합니다. 터미널에 아래 명령어를 입력하여 빠르게 설치하세요!
> - **Mac (Homebrew):** `brew install node`
> - **Linux (Ubuntu/Debian):** `sudo apt update && sudo apt install nodejs npm`
> - **Windows:** [Node.js 공식 홈페이지](https://nodejs.org/)에서 설치

---

## 🗑️ Uninstall (시스템 제거)
설치한 시스템을 지우고 싶을 때도 복잡하게 터미널을 열 필요가 없습니다. 
에이전트 채팅창에 이렇게만 입력하세요.

> *"WizWriting Supporter를 내 컴퓨터에서 흔적도 없이 삭제해 줘. 가이드는 이거야: https://raw.githubusercontent.com/WizMasia/WizWriting_Supporter/refs/heads/main/docs/AGENT_SETUP_GUIDE.md"*

**수동으로 지우려면:**
터미널에서 아래 명령어들을 실행하세요.
```bash
npm rm -g wizwriting-supporter
rm -rf ~/.wizwriting
```

---

## ✨ Key Features
- **호스트 AI 위임 방식 (Host-Agent Delegation):** 사용자에게 API Key를 요구하지 않고, 호스트 IDE의 AI를 적극 활용하여 작업을 수행하도록 정교한 마크다운 프롬프트 지시서(INSTRUCTION)를 발행합니다.
- **초자율형 에이전트 시스템 (Autonomous Tooling):** 에이전트는 [기계 전용 운영 지침서(AGENT_MANUAL)](docs/AGENT_MANUAL.md)를 바탕으로, 작업에 필요한 외부 도구(패키지, 라이브러리)가 없다면 사용자 허락 없이 스스로 터미널을 열고 설치하여 임무를 완수합니다.
- **점수 기반 자동 루프백 (Score-based Loopback):** Reviewer 에이전트가 매긴 점수가 기준치(Threshold) 미달일 경우, 자동으로 코어 엔진이 판단하여 이전 단계로 돌려보내 재작업(수정)을 강제합니다.
- **완전한 이식성:** Node.js가 없는 환경에서도 단 1개의 실행 파일(`.exe`, 바이너리)만 있으면 어디서든 에이전트 시스템을 구동할 수 있습니다.

## 🤖 5가지 전문 에이전트 (The Crew)
1. 🔍 **탐색가 (Explorer):** 웹이나 문서를 분석하여 자료를 수집하고 요약합니다.
2. ✍️ **작성가 (Writer):** 수집된 자료와 문체 가이드라인을 바탕으로 초안을 작성합니다.
3. 🧐 **비평가 (Reviewer):** 작성된 초안을 읽고 논리/출처/가독성을 비평하며 1~100점의 점수를 부여합니다.
4. 📝 **교정가 (Editor):** 비평 피드백을 반영하여 문장을 윤문하고 오탈자를 교정합니다.
5. 🎨 **포맷터 (Formatter):** 템플릿 파일에서 디자인 레이아웃 및 문체 가이드라인을 추출하고 최종 파일을 포맷팅합니다.

---

## 🚀 Getting Started (설치 및 실행)

WizWriting Supporter는 사용자의 편의를 위해 두 가지 강력한 배포 옵션을 제공합니다.

### Option 1. 단일 실행 파일 다운로드 (가장 쉬운 방법)
코딩 환경이 없더라도 누구나 1초 만에 실행할 수 있습니다.
1. 우측의 **[Releases]** 탭으로 이동합니다.
2. 본인의 운영체제에 맞는 파일(`WizWriting_Supporter-win.exe`, `macos`, `linux`)을 다운로드합니다.
3. 원하는 폴더에 넣고 더블클릭하면 즉시 시스템이 구동됩니다.

### Option 2. NPM 글로벌 패키지 설치 (개발자용)
Node.js가 설치된 환경이라면 전역 터미널 명령어로 사용할 수 있습니다.
```bash
# 깃허브 리포지토리를 통해 전역 설치 (추후 npm 퍼블리시 시 패키지명으로 변경 가능)
npm install -g https://github.com/WizMasia/WizWriting_Supporter.git

# 실행
agentic-writer
```

## 🛠️ Configuration
모든 워크플로우와 에이전트의 페르소나는 `orchestration-config.yaml` 파일 단 1개로 제어됩니다. 이 파일에서 순차, 병렬 처리 및 반복 횟수를 자유자재로 설정할 수 있습니다.

```yaml
version: "1.0"
global_settings:
  workspace_dir: "./.agent_workspace"
agents:
  - id: "rep-01"
    role: "representative"
    persona: "전문 기획자"
  # ... (자세한 설정은 예제 파일 참고)
```

---

<div align="center">
  <h2>🤖 AI 호스트 에이전트 완벽 호환 (Universal IDE Integration)</h2>
  <p>WizWriting Supporter는 <b>Antigravity, Cursor, Windsurf, Opencode, 오픈클로, 헤르메스, Claude Code, Cline</b> 등 현존하는 거의 모든 최첨단 AI 에이전트와 결합할 때 200%의 진가를 발휘합니다. API Key 없이, 호스트 AI의 두뇌를 통제하여 완벽한 오토파일럿(Auto-pilot) 문서 작성을 경험해 보세요!</p>
</div>

### 🎯 1. 프로젝트 열기 및 룰 자동 적용
1. 사용하시는 AI 에이전트/IDE 환경에서 이 프로젝트 폴더(`WizWriting_Supporter`)를 엽니다.
2. 프로젝트 루트에 `.cursorrules`, `.windsurfrules`, `CLAUDE.md`, `.clinerules` 등의 글로벌 지침서가 이미 모두 세팅되어 있으므로, **AI가 이 프로젝트를 여는 순간 스스로 호스트 에이전트의 역할과 자가 툴 설치 권한을 깨닫게 됩니다.**

### 🗣️ 2. 에이전트 가동 프롬프트 지시하기
IDE의 챗(Chat) 창에 다음과 같이 **마법의 주문(프롬프트)** 을 입력하세요. (복사해서 붙여넣으세요!)

> [!TIP]
> **사용자 프롬프트 예시:**
> *"지금부터 너는 WizWriting Supporter의 호스트 에이전트야. 내가 터미널에서 `npm start`를 실행하면 엔진이 가동될 거야. 너는 엔진이 `.agent_workspace/` 폴더 안에 만들어내는 `[n]_[에이전트명]_instruction.md` 지시서들을 실시간으로 읽고, 그 안의 페르소나에 빙의해서 업무(자료조사, 작성, 리뷰 등)를 수행해 줘. 
> 업무를 완료할 때마다 각 에이전트 폴더에 있는 `current_status.md` 파일을 열고 `status: "completed"`로 변경한 뒤 `message`에 결과물 요약을 적어줘. 엔진이 다음 지시서를 주면 끝날 때까지 멈추지 말고 이 과정을 계속 반복해. 자, 터미널 실행 버튼 누른다!"*

### 🚀 3. 시스템 가동!
채팅창에 위 지시를 내린 직후, 하단의 터미널 창에 아래 명령어를 입력하고 엔터를 칩니다.
```bash
# 옵션 1. (글로벌 설치 시)
agentic-writer

# 옵션 2. (소스코드 상태 시)
npm start
```

### ✨ 4. 감상하기 (Popcorn Time) 🍿
엔터를 치는 순간부터 당신은 아무것도 할 필요가 없습니다!
1. **CLI 엔진**이 기획서를 짜고 첫 번째 에이전트(Explorer)의 지시서를 `.agent_workspace`에 뱉어냅니다.
2. **IDE AI**가 지시서를 낚아채서 스스로 웹 검색을 하고 자료를 모읍니다. 완료되면 `current_status.md`를 업데이트합니다.
3. **CLI 엔진**이 그걸 인식하고 다음 에이전트(Writer) 지시서를 뱉어냅니다.
4. **IDE AI**가 글을 쓰고, Reviewer가 되어 비평하고, 점수가 낮으면 재작업하는 무한 루프가 **문서가 완성될 때까지 자동으로** 이어집니다!

---

## 🤝 Contribution
WizWriting Supporter는 누구나 참여할 수 있는 오픈소스 프로젝트입니다. 버그 리포트, PR, 새로운 에이전트 아이디어 등 모든 기여를 환영합니다!
