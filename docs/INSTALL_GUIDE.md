# 글타래로 (Geultaraero) 환경별 설치 가이드

본 가이드는 **글타래로** 단일 실행 파일(Standalone Binary)을 활용하여 Windows, macOS, Linux 환경에서 독립적으로 설치하고 외부 동반 유틸리티(`rhwp`, `pdftotext`, `pdftoppm`)를 연동하여 오프라인/폐쇄망 환경에서도 원활하게 작동할 수 있도록 설정하는 방법을 구체적으로 다룹니다.

---

## 📌 전체 아키텍처 개요 및 핵심 연동 원리
글타래로 패키징 바이너리는 구동 시 외부의 문서 파서 엔진을 다음과 같은 순서로 탐색합니다.
1. **바이너리 동반 경로**: 실행 파일(`glro` 또는 `glro.exe`)이 위치한 폴더 직속 및 직속 `bin/<platform>/` 서브 디렉토리
2. **현재 작업 공간**: 터미널에서 명령을 내린 디렉토리(`process.cwd()`) 기준 `bin/<platform>/` 서브 디렉토리
3. **시스템 전역 환경**: OS의 `PATH` 환경변수에 등록된 전역 명령

따라서, **글타래로 실행 파일과 동일한 폴더 혹은 하위 폴더에 외부 유틸리티 바이너리를 함께 모아두는 것만으로도** 추가적인 설치 없이 즉시 사용할 수 있습니다.

---

## 💻 1. Windows 환경 설정 가이드

### 1단계: 실행 파일 배치
1. [Releases 페이지](https://github.com/WizMasia/Geultaraero/releases)에서 운영체제에 맞는 `glro-win-x64.exe` 파일을 다운로드합니다.
2. 원하는 설치 경로(예: `C:\Program Files\geultaraero` 또는 `C:\geultaraero`)를 생성하고 다운로드한 파일명을 `glro.exe`로 변경하여 배치합니다.

### 2단계: 동반 파서 바이너리 배치 (오프라인/Hwp/Pdf 지원 필수)
1. `glro.exe`가 설치된 폴더 안에 `bin/win-x64/` 폴더를 생성합니다.
   ```text
   C:\geultaraero\
     ├── glro.exe
     └── bin\
          └── win-x64\
               ├── rhwp.exe
               ├── pdftotext.exe
               └── pdftoppm.exe
   ```
2. 아래의 외부 바이너리를 각각 다운로드하여 `bin\win-x64\` 폴더 안에 수동으로 넣습니다.
   - **rhwp (한글 파싱)**: [rhwp Releases](https://github.com/edwardkim/rhwp/releases)에서 Windows x64용 `rhwp.exe`를 다운로드합니다.
   - **poppler-utils (PDF 파싱)**: `pdftotext.exe` 및 `pdftoppm.exe` 파일이 필요합니다. [poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases) 등에서 바이너리 패키지를 내려받아 해당 파일들만 추출해 배치합니다.

### 3단계: 환경변수 등록 (선택/권장)
터미널(명령 프롬프트/PowerShell)에서 `glro` 명령을 어디서든 사용할 수 있도록 설정합니다.
1. 윈도우 검색창에 **"시스템 환경 변수 편집"**을 검색하여 실행합니다.
2. **"환경 변수"** 버튼을 클릭합니다.
3. '사용자 변수' 혹은 '시스템 변수' 목록에서 **`Path`** 변수를 찾아 더블 클릭합니다.
4. **"새로 만들기"**를 누르고 `glro.exe`가 들어있는 절대 경로(예: `C:\geultaraero`)를 입력한 후 저장합니다.
5. 터미널을 새로 열어 아래 명령이 성공하는지 확인합니다.
   ```bash
   glro --help
   ```

---

## 🍎 2. macOS 환경 설정 가이드 (Apple Silicon & Intel)

### 1단계: 실행 파일 배치 및 권한 설정
1. [Releases 페이지](https://github.com/WizMasia/Geultaraero/releases)에서 CPU 아키텍처에 맞춰 파일을 다운로드합니다.
   - **Apple Silicon (M1, M2, M3 등)**: `glro-macos-arm64`
   - **Intel CPU**: `glro-macos-x64`
2. 터미널을 열고 다운로드한 바이너리를 시스템 실행 파일 경로인 `/usr/local/bin`에 `glro`라는 이름으로 복사한 뒤 실행 권한을 부여합니다.
   ```bash
   sudo cp ~/Downloads/glro-macos-arm64 /usr/local/bin/glro
   sudo chmod +x /usr/local/bin/glro
   ```

### 2단계: 동반 파서 바이너리 배치
1. 시스템 전역 경로 `/usr/local/bin` 안에 하위 서브 폴더 구조를 만들어 동반 유틸을 배치합니다.
   - **Apple Silicon (arm64)**: `/usr/local/bin/bin/macos-arm64/`
   - **Intel Mac (x64)**: `/usr/local/bin/bin/macos-x64/`
2. 서브 폴더 안에 해당 아키텍처용 `rhwp`, `pdftotext`, `pdftoppm` 파일을 다운로드하여 배치합니다.
   - **맥 사용자 간편 폴백 (온라인/시스템 PATH 활용)**:
     Mac에 패키지 매니저인 `Homebrew`가 설치되어 있는 경우, 동반 PDF 유틸리티는 터미널 명령어 한 줄로 전역 설치하여 즉시 연동할 수 있습니다.
     ```bash
     brew install poppler
     ```

### 3단계: macOS 보안 경고(게이트키퍼) 격리 해제
인터넷에서 직접 다운로드한 바이너리는 macOS 보안 정책에 의해 실행이 차단될 수 있습니다. 터미널에서 다음 명령어를 입력하여 격리 상태를 해제해 줍니다.
```bash
sudo xattr -r -d com.apple.quarantine /usr/local/bin/glro
# 수동으로 배치한 bin 폴더 하위 바이너리들도 동일하게 적용합니다.
sudo xattr -r -d com.apple.quarantine /usr/local/bin/bin/macos-arm64/*
```

---

## 🐧 3. Linux 환경 설정 가이드 (Ubuntu, Debian, CentOS 등)

### 1단계: 실행 파일 배치
1. [Releases 페이지](https://github.com/WizMasia/Geultaraero/releases)에서 `glro-linux-x64` 파일을 다운로드합니다.
2. 터미널을 열고 `/usr/local/bin` 경로로 파일명을 `glro`로 변경하여 복사하고 권한을 부여합니다.
   ```bash
   sudo cp ~/Downloads/glro-linux-x64 /usr/local/bin/glro
   sudo chmod +x /usr/local/bin/glro
   ```

### 2단계: 동반 파서 바이너리 배치 및 대안
1. 수동 설치 시, `/usr/local/bin/bin/linux-x64/` 폴더를 생성하고 Linux x64용 `rhwp` 바이너리 등을 다운로드하여 넣어줍니다.
2. 리눅스 환경에서는 시스템 패키지 매니저를 이용해 PDF 파서(`poppler-utils`)를 전역으로 깔끔하게 설치하는 방식을 적극 권장합니다.
   - **Debian / Ubuntu 계열**:
     ```bash
     sudo apt-get update
     sudo apt-get install -y poppler-utils
     ```
   - **RedHat / CentOS / RHEL 계열**:
     ```bash
     sudo yum install -y poppler-utils
     ```
