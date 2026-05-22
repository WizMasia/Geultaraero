<div align="center">
  <h1>🚀 WizWriting Supporter</h1>
  <p><b>마크다운 기반의 다중 에이전트(Multi-Agent) 리포트 자동 작성 오케스트레이터</b></p>
</div>

---

## 💡 Overview
**WizWriting Supporter**는 고품질의 기술 문서, 시장 조사 보고서, 비즈니스 리포트를 작성하기 위해 **5가지의 전문 에이전트**들이 협동하는 강력한 CLI 기반 오케스트레이터 시스템입니다. 

기존의 복잡한 API Key 세팅이나 서버 연동 없이, 사용자가 주로 사용하는 **AI IDE(Antigravity, Opencode 등)**의 강력한 지능을 호스트 에이전트로 활용하여 문서 작성 파이프라인을 통제합니다. 

## ✨ Key Features
- **호스트 AI 위임 방식 (Host-Agent Delegation):** 사용자에게 API Key를 요구하지 않고, 호스트 IDE의 AI를 적극 활용하여 작업을 수행하도록 정교한 마크다운 프롬프트 지시서(INSTRUCTION)를 발행합니다.
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

## 🤝 Contribution
WizWriting Supporter는 누구나 참여할 수 있는 오픈소스 프로젝트입니다. 버그 리포트, PR, 새로운 에이전트 아이디어 등 모든 기여를 환영합니다!
