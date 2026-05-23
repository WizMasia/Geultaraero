# Offline Setup Guide for HWP/HWPX Integration / HWP/HWPX 연동 오프라인 설치 가이드

This document describes how to configure the `Geultaraero` environment to support HWP/HWPX document parsing and template generation in a completely offline or restricted network environment.
본 문서는 오프라인 또는 폐쇄망 환경에서 HWP/HWPX 문서 파싱 및 템플릿 생성을 원활히 사용하기 위해 `글타래로` 환경을 수동으로 구성하는 방법을 설명합니다.

---

## 1. Overview / 개요
By default, the core engine executes HWP/HWPX processes using a local native execution runner. To run without downloading dependencies on-demand, you must pre-populate the target platform-specific `rhwp` CLI binary in the local workspace.
기본적으로 코어 엔진은 로컬 네이티브 실행기를 통해 HWP/HWPX 처리를 진행합니다. 폐쇄망 등에서 실시간 다운로드 없이 오프라인으로 작동하게 하려면, 플랫폼용 `rhwp` CLI 바이너리를 로컬 워크스페이스에 미리 설정해야 합니다.

---

## 2. Binary Downloads & Setup / 바이너리 다운로드 및 설정

### Step 1: Download target binaries / 대상 바이너리 다운로드
From a machine with internet access, download the appropriate binaries for your platforms from the official release page:
인터넷이 제공되는 PC에서 공식 릴리스 페이지를 통해 사용 환경에 맞는 바이너리를 다운로드합니다:
- **Download Link / 다운로드 링크**: [edwardkim/rhwp Releases](https://github.com/edwardkim/rhwp/releases)

### Step 2: Configure directory structure / 디렉토리 구조 설정
Create a `bin/` directory at the project root and place the renamed binaries (`rhwp` or `rhwp.exe`) in the subdirectories corresponding to the operating system and architecture as shown below:
프로젝트 루트 디렉토리에 `bin/` 폴더를 생성하고, 파일명을 `rhwp` (Windows의 경우 `rhwp.exe`)로 변경한 뒤 각 OS/아키텍처에 맞게 배치합니다:

```
[Project Root] / [프로젝트 루트]
  ├── bin/
  │    ├── macos-arm64/
  │    │     └── rhwp            <-- macOS Apple Silicon Binary
  │    ├── macos-x64/
  │    │     └── rhwp            <-- macOS Intel Binary
  │    ├── linux-x64/
  │    │     └── rhwp            <-- Linux Intel 64bit Binary
  │    └── win-x64/
  │          └── rhwp.exe        <-- Windows 64bit Executable
```

### Step 3: Grant execution permissions (macOS / Linux) / 실행 권한 부여 (macOS / Linux)
On macOS and Linux, you must grant execution permissions to the binaries so the engine can run them:
macOS 및 Linux 환경에서는 엔진이 바이너리를 정상 구동할 수 있도록 실행 권한을 수동으로 부여해야 합니다:

```bash
# For macOS Apple Silicon
chmod +x bin/macos-arm64/rhwp

# For macOS Intel
chmod +x bin/macos-x64/rhwp

# For Linux
chmod +x bin/linux-x64/rhwp
```

---

## 3. Verify Offline Functionality / 오프라인 기능 검증
To verify the setup, run the test suites locally:
설정이 완료되었으면 로컬에서 테스트 스위트를 구동하여 기능을 검증합니다:

```bash
# Run environment & parser tests
npm test src/utils/__tests__/rhwp-runner.test.ts
npm test src/utils/__tests__/hwp-parser.test.ts
npm test src/utils/__tests__/hwp-generator.test.ts
```

If the tests pass, HWP/HWPX local processing will work smoothly under complete offline environments.
테스트가 모두 정상 통과하면, 오프라인 및 인터넷이 단절된 환경에서도 HWP/HWPX 로컬 파싱 및 템플릿 생성이 안정적으로 동작합니다.
