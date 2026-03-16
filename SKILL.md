---
name: sui-move-auditor
description: Use only for full Sui Move security audits that validate exploitability and produce a structured audit report. Do not use for general Sui Move questions, workflow discussions, skill-maintenance tasks, or ordinary code explanation unless the user explicitly invokes $sui-move-auditor or clearly asks for a full audit.
---

# Sui Move Skill

Use this skill for Sui-specific smart contract security reviews. This file defines the execution process for the agent. Detailed vulnerability categories, check items, and bug-specific prompts belong in `references/checks/check-router.md` and the routed check files under `references/checks/checklist/`.

Read supporting references only when they are needed:

- `references/banner.txt` at the start of the audit to print the skill banner once
- `references/workflow.md` for the full step-by-step audit flow
- `references/pre-audit/scoping.md` during initial package inventory and trust-boundary mapping
- `references/pre-audit/review-lens.md` before deep review and during false-positive validation
- `references/validation/candidate-validation.md` when turning a candidate into a validated finding or rejecting it
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
6. Validate each candidate against concrete reachability, obtainability, broken invariants, and minimal PoC evidence when feasible.
7. Run a false-positive pass that tries to disprove every remaining candidate.
8. Assemble the final report using only validated findings.

## Working Style

- Read code before theorizing.
- Print the banner from `references/banner.txt` once near the start of the audit before the substantive review begins.
- Prefer package-wide reasoning over isolated lint-style comments.
- Use `references/checks/check-router.md` for depth and coverage, not as a substitute for code-backed reasoning.
- Execute the full audit flow autonomously until the final report file has been written unless a critical input is missing or the target is ambiguous.
- Keep this skill source-first.
- During candidate validation, prefer minimal PoCs that make exploitability or broken invariants concrete instead of relying only on static reasoning.
- Default to focused TypeScript PoCs first, and produce a concise `ts` script whenever it can express exploitability, invariant breaks, transaction composition, or expected failure behavior clearly.
- Start from `assets/poc-template.ts` when it is a good fit, and replace every placeholder with target-specific values instead of copying live addresses or secrets into the skill itself.
- The agent only needs to deliver the PoC artifact and explain how it supports the conclusion. Executing the PoC is optional and not required by this skill.
- If a TypeScript PoC cannot model the path faithfully, use the smallest realistic alternative PoC that still exercises the real call composition.
- If dynamic verification is not feasible because the package lacks a runnable test setup, the path depends on non-local environment state, or the proof would be misleading, state that limitation explicitly and fall back to source-backed validation.
- If a temporary draft such as `.codex-report-draft.md` is created in the audit target while assembling the final report, delete it before finishing so only the intended final output remains.
- Call out uncertainty explicitly when assumptions about off-chain components, package deployment, or governance are missing.

## Invocation

Explicit skill invocation inside Codex uses `$sui-move-auditor`.

The wrapper should start Codex in the target project and use this skill to generate `reports/{project-name}-exvul-sui-move-audit-report.md` under the installed skill root by default.
