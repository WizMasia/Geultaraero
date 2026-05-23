# Geultaraero (글타래로)

**Markdown-Based Multi-Agent Report Writing Orchestrator**

> [한글(Korean) 버전 읽기](README.md)
>
> **Notice:** This project is currently in the Pre-release stage. The core architecture is implemented, but prompt tuning and minor features are under active development.

---

## 1. Overview
Geultaraero is an orchestration system where 5 independent AI personas (Representative, Explorer, Writer, Reviewer, Editor, and Formatter) interact to automatically write and review reports in Markdown format.

---

## 2. Installation & Setup

Geultaraero supports optimized installation methods based on your environment. Copy and paste one of the following prompts into your Host Agent (Antigravity, Cursor, Claude Code, etc.) chat panel to automate the setup.

### 📋 AI Agent Prompts to Copy & Paste

#### 1️⃣ Option 1: Full System Auto-Installation
> Use this prompt to install the full Node.js CLI engine (`glro`) or pre-compiled binaries along with the custom workspace rules.
```text
Install and configure the full Geultaraero system (including Node.js/binary installation and rule files setup) by following Part 1 (Priority 1) of the instructions here:
https://raw.githubusercontent.com/WizMasia/Geultaraero/refs/heads/main/docs/AGENT_SETUP_GUIDE.md
```

#### 2️⃣ Option 2: Zero-Dependency Agent-Only Mode Setup
> Use this prompt to configure ONLY the agent rules (.agent/ and workspace rule files) without installing any separate Node.js package or engine binaries.
```text
Configure the Geultaraero system using the zero-dependency Agent-Only Mode (Priority 2) by following the instructions here:
https://raw.githubusercontent.com/WizMasia/Geultaraero/refs/heads/main/docs/AGENT_SETUP_GUIDE.md
Create the .agent/ directory and setup only the rule files for my AI IDE without installing any Node.js packages or binaries.
```
> ⚠️ **CRITICAL WARNING (Option 2 Limitations):**
> **Option 2 (Agent-Only Mode / prompt-only installation)** does not configure local binaries or the Node.js execution engine on your machine. **Therefore, all local offline document parsing features (HWP/HWPX, PDF, Image OCR, and MS Office files parsing) are completely unavailable.**
> To utilize these local resource parsing features, you must install the full core engine via **Option 1 (Full Core Mode)**.

---

## 3. Key Features

- **Offline Survival Mode (Network-Disconnected Support):** If network access is cut or external search is unavailable, the agent stops web searching and relies strictly on documents in the local `input_materials/` directory.
- **sLM Memory Optimization (Rolling Summary):** For environments with limited context window sizes or small local models, long documents are divided into chunks and summarized incrementally (Rolling Summary) to avoid Out-Of-Memory (OOM) issues.
- **Pre-Flight Interview & Planning UX:** Before initiating report generation, the agent conducts an interview with the user to clarify requirements, and the Representative agent drafts a "Research & Structure Plan" for user validation before initiating the research.
- **Auto-Tooling (Dependency Auto-Installation):** If external parsers or tools needed for processing are missing, the agent analyzes the local system environment and installs the required packages autonomously.
- **Score-based Loopback:** If the score assigned to the output by the Reviewer persona falls below the threshold (80 points by default), the system passes feedback back to the previous steps to force rework.

---

## 4. Local Resource Parsing (`input_materials/`)

Geultaraero is optimized for parsing local resource materials. Simply create an `input_materials/` folder in the project root directory and place reference materials inside. The agent will analyze them with the highest priority.

- **HWP/HWPX:** Automatically downloads parsers to extract plain text.
- **PDF & Image:** For non-extractable documents, the agent splits PDF files (`pdf2image`), extracts text via OCR (`tesseract`), and, if needed, directly inspects the images using Vision LLMs.
- **DOCX/PPTX/XLSX (MS Office):** Directly parses XML document nodes from the zip file without external libraries, extracting text, slide text, and sheets into standard Markdown paragraphs and tables.

---

## 5. Architecture

### 5.1 Full-CLI Mode (Asynchronous Multi-Agent Architecture)
A TypeScript-based CLI runtime engine (`glro`) communicates with the host IDE via a Markdown-based workspace state file (`.agent_workspace/`). Independent personas perform tasks asynchronously following their respective directives (`instruction.md`), coordinated by the central runtime engine.

### 5.2 Config-Only Mode (Single Role-Playing Architecture)
A lighter system without external CLI runtimes. It leverages only the custom rules file `AGENT.md` (which gets copied/linked to the IDE's rules file). The host agent changes roles sequentially within a single context to complete tasks.

---

## 6. Configuration

The static workflow and agent personas of the system are controlled by the `orchestration-config.yaml` file, and dynamic settings for users to fine-tune behaviors are merged via the `settings.json` file.

### 6.1. settings.json (Dynamic User Config)
You can easily adjust agent behaviors by writing the following JSON values in the `.agent/settings.json` or root `settings.json` file.

```json
{
  "language": "ko",                // Default output language ("ko" | "en")
  "workspaceDir": "./.workspace",  // Agent workspace directory
  "reviewThreshold": 80,           // Review acceptance threshold score (0~100)
  "maxIterations": 3,              // Maximum iterations for feedback loop
  "enableOfflineMode": false,      // Enable offline survival mode (boolean)
  "exportDir": "./export",         // Output folder path for the final reports (string)
  "generateWorkSummary": false     // Whether to automatically compile agent logs and messages (boolean)
}
```

* **`exportDir`**: The target directory where the final completed reports are copied and preserved.
* **`generateWorkSummary`**: If set to `true`, it automatically compiles the complete execution history, status summaries, and message archives of all agents into a unified markdown summary (`[report_name]_summary.md`) inside the `exportDir`. If set to `false`, the Representative agent will prompt you via chat at the end of the workflow to ask if you wish to generate the summary.

### 6.2. orchestration-config.yaml (Static Workflow)
```yaml
version: "1.0"
global_settings:
  workspace_dir: "./.agent_workspace"
agents:
  - id: "rep-01"
    role: "representative"
    persona: "Professional Planner"
```

---

## 7. Uninstallation

Run the following commands in your terminal to remove global links and the repository:

```bash
npm rm -g geultaraero
rm -rf ~/.geultaraero
```

---

## 8. Contribution
Geultaraero is an open-source project. Bug reports and Pull Requests are always welcome!
