# Sui Move Skill

`sui-move-skill` is a security-focused skill for auditing, hardening, and patching Sui Move packages. It is designed for agents that need a repeatable workflow for finding real vulnerabilities, proposing minimal fixes, adding regression tests, and producing a structured audit report.

## What This Skill Is For

Use this skill when you want to:

- audit a Sui Move package for security issues
- review access control, capability handling, shared object safety, and fund flows
- patch a known vulnerability with the smallest reasonable code change
- add negative tests and regression tests
- generate a written audit report

Do not use this skill for:

- general Move syntax questions
- feature development without a security goal
- non-Move codebases

## What It Checks

The skill is optimized for high-value Sui Move review areas:

- capability-based access control
- capability leakage and re-mintable privilege paths
- shared object mutation safety
- object lifecycle and invariant maintenance
- treasury, mint, burn, withdraw, and accounting logic
- `dynamic_field` key collision and cleanup risks
- `friend` trust boundaries and upgrade risks
- clock, oracle, and PTB composition issues
- missing security events and weak abort-code hygiene

## Directory Layout

```text
sui-move-skill/
├── README.md
├── checklist.md
└── skill.md
```

- `skill.md`: main agent instructions, trigger rules, workflow, and report format
- `checklist.md`: condensed review checklist for fast pattern-based scanning
- `README.md`: human-facing usage documentation

## Required Inputs

Before reaching conclusions, the reviewer should read:

- `Move.toml`
- `sources/*.move`
- `tests/*.move`

If any of these are missing, the review should explicitly state that coverage is incomplete and confidence is lower.

## How To Use It

### 1. Provide a complete Sui Move package

The package should look roughly like this:

```text
my-package/
├── Move.toml
├── sources/
│   ├── admin.move
│   ├── vault.move
│   └── token.move
└── tests/
    └── vault_tests.move
```

### 2. Ask for one of the supported modes

This skill is built around three modes:

- `audit`: review existing code for vulnerabilities
- `build`: implement new code with secure defaults
- `patch`: fix a known issue and verify the fix

### 3. Use a direct prompt

Recommended prompt patterns:

#### Audit a package

```text
Use sui-move-skill to audit this Sui Move package.
Focus on TreasuryCap handling, shared object mutation, dynamic_field usage, and upgrade risks.
Only report issues with a concrete exploit path.
Write the final report to a Markdown file.
```

#### Patch a known issue

```text
Use sui-move-skill in patch mode.
Fix the privilege bypass in this Sui Move module, keep the diff minimal, and add regression tests.
```

#### Build with secure defaults

```text
Use sui-move-skill in build mode.
Implement the admin flow for this Sui Move package using capability-based authorization instead of sender checks.
Add tests for unauthorized access.
```

#### Review only one module

```text
Use sui-move-skill to review sources/vault.move.
Prioritize fund-withdrawal paths, shared-object writes, and accounting invariants.
```

#### Review and patch in one pass

```text
Use sui-move-skill to audit and patch this package.
If you find a real issue, patch it with the smallest safe change and add a regression test.
```

## Suggested Review Workflow

The skill follows this sequence:

1. declare `MODE: audit`, `MODE: build`, or `MODE: patch`
2. read `Move.toml`, all source files, and existing tests
3. build an attack-surface map of externally reachable functions
4. run a quick high-signal scan for known dangerous patterns
5. perform a category-by-category deep review
6. prove each finding with a plausible exploit path
7. patch minimally
8. add negative and regression tests
9. write the audit report

## Expected Output

The default report filename is:

```text
audit-report-<package-name>-<YYYY-MM-DD>.md
```

The report is expected to include:

- Scope and Assumptions
- Executive Summary
- Attack Surface Map
- Findings
- Patch Summary
- Tests Added / Updated
- Residual Risks and Follow-ups

Each finding should include:

- severity
- exact location
- impact
- exploit path
- vulnerable code snippet
- recommended minimal fix

## Concrete Usage Tips

- Give the agent the whole package, not isolated snippets, unless you only want a narrow review.
- State the risk areas you care about most, such as `TreasuryCap`, `shared object`, `dynamic_field`, or `upgrade policy`.
- If you only want actionable findings, explicitly say: `Only report issues with a concrete exploit path.`
- If you want code changes, explicitly say: `Patch the issue and add regression tests.`
- If some dependencies are missing or external packages are not available, the final report should say so.

## Example End-to-End Request

```text
Use sui-move-skill to audit this Sui Move package in audit mode.
Read Move.toml, all modules under sources/, and all tests under tests/.
Build an attack surface map first.
Focus on capability leakage, sender-based auth, shared object mutation, mint/burn safety, dynamic_field cleanup, and upgrade governance.
Only report findings with a concrete exploit path.
If you patch anything, keep the diff minimal and add regression tests.
Write the final report to audit-report-<package-name>-<YYYY-MM-DD>.md.
```

## Methodology

This skill is intentionally strict:

- it prefers proven findings over speculative pattern matches
- it treats capability-based authorization as the default secure model
- it favors minimal patches over broad rewrites
- it expects findings to be backed by exploitability, not just suspicious code

## Related Files

- Detailed instructions: [skill.md](/home/ch1hiro/project/Sec-Tools/AI-Audit-Skills/sui-move-skill/skill.md)
- Fast review checklist: [checklist.md](/home/ch1hiro/project/Sec-Tools/AI-Audit-Skills/sui-move-skill/checklist.md)
