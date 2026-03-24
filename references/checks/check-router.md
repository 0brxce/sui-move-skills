# Sui Move Check Router

## Purpose

Use this file to:

1. Route the package to the right check references after scoping.
2. Re-check coverage before finalizing findings.

Do not load every check by default.

Global rules:

- Every checklist hit starts as a candidate only.
- A confirmed high-impact finding requires attacker reachability, obtainable required inputs, a concrete broken invariant or unauthorized effect, and no blocking Sui rule from ownership, visibility, typing, or abort semantics.
- A candidate may validate either as an exploitability finding or as a lower-severity security note if the code shows a concrete security-relevant downside.
- Every `FP` condition in a check file is only a verification prompt, not proof of safety by itself.

## Check Routes

| Check | Load When |
|---|---|
| `check-01` | Caps, witness types, admin objects, role objects, privileged authority, recovery flows, or sender-gating |
| `check-02` | Shared objects, vaults, escrow, custody objects, wrappers, kiosk-like flows, asset lifecycle transitions, or pool/position pairings that must stay bound to one another |
| `check-03` | Mint, burn, withdraw, deposit, claim, rewards, fees, replay risk, accounting and supply invariants, share or debt registries, or precision-sensitive fixed-point math |
| `check-04` | Dynamic fields, tables, bags, derived storage, registries, cleanup, or keying mistakes |
| `check-05` | `friend`, `public(package)`, overexposed framework helpers, upgrades, migrations, external trust assumptions, or cross-module privilege boundaries |
| `check-06` | Clock, epoch, oracle, price, timing, freshness, or market-assumption logic |
| `check-07` | PTB composition, sequencing bugs, multi-step workflows, one-shot resources, pause controls, or emergency-function overreach |
| `check-08` | Event coverage, event forgery surfaces, observability, or abort-code quality that matters to monitoring or security-relevant workflows |

Use the false-positive challenge questions in `references/validation/candidate-validation.md` only during the false-positive pass.

## Mandatory Pairings

- If `check-01` applies and privileged authority touches shared or custody-bearing objects, also load `check-02`.
- If `check-01` applies and authority depends on package boundaries, upgrades, or migration flows, also load `check-05`.
- If `check-02` applies and shared objects hold balances, vault accounting, mint state, or redeemable assets, also load `check-03`.
- If `check-02` applies and asset safety depends on sequencing or single-transaction composition, also load `check-07`.
- If `check-02` applies and functions accept both a pool-like object and a position, debt bag, or share container that must refer to the same lineage, also load `check-03`.
- If `check-03` applies and accounting or redemption logic depends on oracle or time inputs, also load `check-06`.
- If `check-04` applies and storage structure affects custody, balances, or entitlement lookup, also load `check-02` or `check-03`.
- If `check-05` applies and upgrade, migration, or maintenance flows can be combined with user-reachable calls, also load `check-07`.

## Common Skips

- Skip `check-02` if there are no shared objects, custody objects, wrappers, or user-asset state transitions.
- Skip `check-03` if there is no balance, supply, claim, fee, reward, or value-moving accounting.
- Skip `check-04` if there are no dynamic fields, tables, bags, registries, or derived storage patterns.
- Skip `check-05` if there are no `friend` boundaries, upgrade or migration flows, or meaningful external trust assumptions.
- Skip `check-06` if correctness does not depend on time, oracle, epoch, or market-derived inputs.
- Skip `check-07` if there is no multi-step workflow, sequencing-sensitive state machine, or emergency or pause control surface.
- Skip `check-08` only if the user explicitly requests an exploitability-only review and events or abort codes clearly do not affect any monitored or security-relevant workflow.

Do not skip a topic just because the package is small. Record routed and skipped topics in working notes.
