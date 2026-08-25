# Secrets & Env Vars Scanner

Scans your workspace for hardcoded secrets, API keys, and risky environment-variable
usage, and flags them inline as diagnostics and in a summary report. Runs entirely
locally — no data ever leaves your machine.

## Features

- **Live diagnostics**: as you open, edit, or save files, detected secrets are
  underlined and listed in the Problems panel.
- **Workspace scan**: run `Secrets Scanner: Scan Workspace for Secrets` from the
  Command Palette to scan source and configuration files (excluding prose
  documentation, `node_modules`, `.git`, and build output) and get a full report
  in the "Secrets Scanner" Output channel.
- **Detects common secret formats**: AWS access keys, GitHub/Slack/Stripe/Google
  tokens, PEM private key blocks, JWTs, and generic `key = "..."` assignments.
- **`.env` file awareness**: flags empty or placeholder values (e.g. `changeme`)
  in `.env`-style files, and warns when a real `.env` file (not `.env.example`)
  doesn't appear to be covered by `.gitignore`.
- **Redacted output**: matched values are always masked (e.g. `AKIA****3F2A`) in
  diagnostics and reports — the real secret is never displayed or logged in full.
- **Status bar indicator**: shows the live count of findings; click it to jump
  to the Problems panel.
- **Sidebar findings view**: an Explorer panel ("Secrets Scanner Findings")
  lists every issue grouped by file with a plain-English explanation; click one
  to jump straight to that line.
- **Undefined environment variable detection**: flags `process.env.X`,
  Python's `os.environ`/`os.getenv`, and Terraform's `var.x` references that
  aren't defined in any `.env`, `.tf` (`variable "x" {}`), or `.tfvars` file in
  the workspace.

## Usage

1. Open a workspace.
2. Findings appear automatically in the Problems panel as you work.
3. Run `Secrets Scanner: Scan Workspace for Secrets` from the Command Palette
   (`Cmd+Shift+P`) to scan the entire workspace at once.

## Requirements

None — works out of the box.

## Extension Settings

- `secretsEnvScanner.disabledPatterns`: array of pattern IDs to disable (e.g.
  `"aws-access-key"`, `"generic-api-key"`).
- `secretsEnvScanner.excludeGlob`: glob of files/folders to skip during workspace
  scans. Defaults to `node_modules`, `.git`, and common build output folders.
  Common prose documentation files such as `README.md` are always skipped.
- `secretsEnvScanner.maxFileSizeKB`: maximum file size (KB) to scan; larger files
  are skipped. Defaults to `1024`.

## Known Issues

- Detection is regex-based and may produce false positives/negatives; review
  findings before acting on them.
- Binary files and files larger than 1 MB are skipped during workspace scans.

## Release Notes

### 0.0.1

Initial release: secret pattern detection, live diagnostics, workspace scan
command, and `.env` file checks.

**Enjoy!**
