# exvul-sui-move-skill

Autonomous Sui Move security audit skill for Codex, built for validated findings and structured reports.

```text
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║               ███████╗██╗  ██╗██╗   ██╗██╗   ██╗██╗                       ║
║               ██╔════╝╚██╗██╔╝██║   ██║██║   ██║██║                       ║
║               █████╗   ╚███╔╝ ██║   ██║██║   ██║██║                       ║
║               ██╔══╝   ██╔██╗ ╚██╗ ██╔╝██║   ██║██║                       ║
║               ███████╗██╔╝ ██╗ ╚████╔╝ ╚██████╔╝███████╗                  ║
║               ╚══════╝╚═╝  ╚═╝  ╚═══╝   ╚═════╝ ╚══════╝                  ║
║                                                                           ║
║        ███████╗██╗   ██╗██╗   ███╗   ███╗ ██████╗ ██╗   ██╗███████╗       ║
║        ██╔════╝██║   ██║██║   ████╗ ████║██╔═══██╗██║   ██║██╔════╝       ║
║        ███████╗██║   ██║██║   ██╔████╔██║██║   ██║██║   ██║█████╗         ║
║        ╚════██║██║   ██║██║   ██║╚██╔╝██║██║   ██║╚██╗ ██╔╝██╔══╝         ║
║        ███████║╚██████╔╝██║   ██║ ╚═╝ ██║╚██████╔╝ ╚████╔╝ ███████╗       ║
║        ╚══════╝ ╚═════╝ ╚═╝   ╚═╝     ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝       ║
║                                                                           ║
║                   ███████╗██╗  ██╗██╗██╗     ██╗                          ║
║                   ██╔════╝██║ ██╔╝██║██║     ██║                          ║
║                   ███████╗█████╔╝ ██║██║     ██║                          ║
║                   ╚════██║██╔═██╗ ██║██║     ██║                          ║
║                   ███████║██║  ██╗██║███████╗███████╗                     ║
║                   ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

## What Is This?

`exvul-sui-move-skill` is a Codex skill for autonomous end-to-end security reviews of Sui Move packages. It is designed for full audits, not casual code explanation. The skill scopes the package, routes review paths through Sui-specific checklists, validates candidate issues against reachability and broken invariants, and writes a structured final report.

The workflow is built to reduce weak findings:

- source-first review before theorizing
- explicit privilege and asset mapping
- candidate validation with minimal PoC evidence when feasible
- false-positive pressure testing before final reporting
- report output limited to validated findings

## Key Features

- Autonomous audit flow from initial scoping through final report writing
- Built-in startup banner sourced from `references/banner.txt`
- Sui-specific review guidance for object ownership, capabilities, custody, and PTB composition
- PoC-first validation in stage 6, with focused TypeScript PoCs preferred when they can materially strengthen conclusions
- Bundled TypeScript PoC starter template in `assets/poc-template.ts`
- Adversarial false-positive filtering before a candidate becomes a finding
- Structured report format with severity, confidence, exploit path, and PoC validation evidence

## Prerequisites

- Codex with skill loading enabled
- A local Node.js / TypeScript environment if validation needs a TypeScript PoC

## Installation

Clone this repository into your local Codex skills directory:

```bash
git clone https://github.com/exvulsec/sui-move-skill.git ~/.codex/skills/sui-move-auditor
```

The Git repository name is `sui-move-skill`, but the installed skill directory should be `sui-move-auditor`.

## Usage

Open Codex in the target Sui repository and invoke the skill:

```text
$sui-move-auditor
```

Or provide an explicit instruction:

```text
Use $sui-move-auditor to audit this Sui Move package and write the final report.
```

## Output

Default output location:

```text
reports/<project-name>-exvul-sui-move-audit-report.md
```

The generated report includes:

- validated findings only
- severity and confidence assignments
- exploit paths
- PoC validation notes
- rejected or unvalidated issue tracking
- checklist coverage

## How It Works

The skill runs an eight-step workflow:

1. Scope the package and trust boundaries.
2. Build a privilege and asset map.
3. Route the package through the relevant checklist topics.
4. Trace critical state transitions.
5. Review attacker-controlled reachability and function composition.
6. Validate candidates with concrete reachability, broken invariants, and minimal PoC evidence when feasible.
7. Run a false-positive pass to disprove weak candidates.
8. Write the final report using only validated findings.

Validation defaults to the lightest strong evidence available:

- TypeScript PoC first
- helper-module PoC when a script-driven harness cannot express the relevant transition cleanly
- source-only validation only when a realistic PoC is not feasible

The skill only requires the agent to produce the PoC artifact. Executing the PoC is optional and not required.

## Project Structure

```text
.
├── SKILL.md
├── agents/
│   └── openai.yaml
├── assets/
│   └── poc-template.ts
├── references/
│   ├── workflow.md
│   ├── checks/
│   ├── pre-audit/
│   ├── reporting/
│   └── validation/
└── reports/
    └── README.md
```

## Included References

- `references/workflow.md` defines the end-to-end audit process
- `references/checks/check-router.md` routes the package to the relevant review topics
- `references/pre-audit/` covers scoping and privilege-review lenses
- `references/validation/` covers candidate validation and false-positive filters
- `references/reporting/` defines report formatting and severity policy

## Report Characteristics

The final report is compact and audit-oriented. Each validated finding includes:

- risk
- confidence
- affected function or module
- validation evidence type
- exploit path
- PoC validation note
- recommendation

## Contact

If you are looking to explore strategies for securing your project, reach out for a chat on Telegram [@realnolan](https://t.me/realnolan).
[![X (formerly Twitter)](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/exvulsec)
[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/realnolan)
[![Website](https://img.shields.io/badge/Website-000000?style=for-the-badge&logo=safari&logoColor=white)](https://exvul.com)

## Acknowledgements

Built by [exvulsec](https://github.com/exvulsec).

## License

This repository is licensed under the [MIT License](https://github.com/exvulsec/sui-move-skill/blob/main/LICENSE).
