# Sui Move Auditor

Codex skill for **Sui Move security audits** and structured finding validation.

## Install & Run

Works with Codex skill loading.

Install the skill into your local Codex skills directory:

```bash
git clone https://github.com/exvulsec/sui-move-skill.git ~/.codex/skills/sui-move-auditor
```

The Git repository name is `sui-move-skill`, but the installed local Codex skill directory must be `sui-move-auditor`.

The skill is then invocable as `$sui-move-auditor`.

Example usage inside Codex:

```text
$sui-move-auditor
```

Or:

```text
Use $sui-move-auditor to audit this Sui Move package and write the final report to audit-report.md
```

## Skills

| Skill | Description |
| --- | --- |
| `sui-move-auditor` | Full Sui Move security audits with exploitability validation and structured report output |

## Output

Default output file:

```bash
audit-report.md
```

## What It Does

- Scopes the Sui Move package before review
- Maps assets, authorities, and trust boundaries
- Validates whether a candidate issue is actually exploitable
- Filters false positives before reporting
- Produces a structured final audit report
