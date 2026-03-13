---
name: sui-move-auditor
description: Use only for full Sui Move security audits that validate exploitability and produce a structured audit report. Do not use for general Sui Move questions, workflow discussions, skill-maintenance tasks, or ordinary code explanation unless the user explicitly invokes $sui-move-auditor or clearly asks for a full audit.
---

# Sui Move Skill

Use this skill for Sui-specific smart contract security reviews. This file defines the execution process for the agent. Detailed vulnerability categories, check items, and bug-specific prompts belong in `references/checks/check-router.md` and the routed check files under `references/checks/checklist/`.

Read supporting references only when they are needed:

- `references/workflow.md` for the full step-by-step audit flow
- `references/pre-audit/scoping.md` during initial package inventory and trust-boundary mapping
- `references/pre-audit/review-lens.md` before deep review and during false-positive validation
- `references/validation/candidate-validation.md` when turning a candidate into a validated finding or rejecting it
- `references/validation/sui-framework-reference.md` when validation depends on Sui framework or Move stdlib semantics
- `references/validation/false-positive-filters.md` during the false-positive pass
- `references/reporting/report-formatting.md` before assembling the final report
- `references/reporting/severity.md` when assigning risk and confidence

Read `references/checks/check-router.md` twice:

- once after initial scoping, to decide which topic references to load
- once before finalizing findings, to confirm coverage and eliminate blind spots

Treat `references/checks/check-router.md` as the checklist router and loading guide. Treat this file as the workflow and reporting layer.

Some harder checklist items include tiny Sui Move examples. Use them to recognize the state transition or invariant being discussed, but never treat the example match alone as a finding.
Default toward omission over speculation: a missed weak lead is better than a reported false exploit path.

## Audit Objective

Your job is to determine whether an attacker can do any of the following:

- gain assets, minting power, or privileged control without authorization
- violate economic or state invariants
- lock, burn, freeze, or orphan user assets unexpectedly
- bypass intended workflow or role restrictions
- exploit initialization, migration, or upgrade paths

Prioritize real impact over surface-level observations. A good finding in Sui Move usually ties together object ownership, capabilities, and a broken state transition.

## Workflow

Use `references/workflow.md` for the full step-by-step procedure.

1. Scope the package and identify trust boundaries before loading topic checks.
2. Build a privilege and asset map to anchor the rest of the review.
3. Route the package to the relevant checklist topics and skip the rest explicitly.
4. Trace critical state transitions instead of reasoning from isolated lines.
5. Test attacker-controlled reachability and function composition paths.
6. Validate each candidate against concrete reachability, obtainability, and broken invariants.
7. Run a false-positive pass that tries to disprove every remaining candidate.
8. Assemble the final report using only validated findings.

## Working Style

- Read code before theorizing.
- Prefer package-wide reasoning over isolated lint-style comments.
- Use `references/checks/check-router.md` for depth and coverage, not as a substitute for code-backed reasoning.
- Execute the full audit flow autonomously until the final report file has been written unless a critical input is missing or the target is ambiguous.
- Keep this skill strictly static-analysis driven by default.
- Do not run tests, build commands, or package commands such as `sui move test`, `sui move build`, or similar verification commands unless the user explicitly overrides this instruction.
- Do not ask the user for permission to execute shell commands as part of the default audit flow. If static analysis is sufficient, continue to the report without pausing for command approval.
- If dynamic validation would normally help but is not explicitly requested, record the limitation in the report and continue with code-backed static analysis instead of asking to execute commands.
- When exploitability or safety depends on Sui framework behavior, cross-check the relevant module semantics against the canonical sources described in `references/validation/sui-framework-reference.md`.
- Call out uncertainty explicitly when assumptions about off-chain components, package deployment, or governance are missing.

## Invocation

Explicit skill invocation inside Codex uses `$sui-move-auditor`.

The wrapper should start Codex in the target project and use this skill to generate `reports/{project-name}-exvul-sui-move-audit-report.md` under the installed skill root by default.
