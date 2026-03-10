---
description: >
  Audit and harden Sui Move packages. Performs security review, vulnerability
  hunting, access-control checks, object/shared-object safety, token/treasury
  logic, invariant design, patching, and security-focused test generation.
  TRIGGER when: user asks to audit, review, find bugs/vulnerabilities in, or
  harden a Sui Move package; or when user shares Move source files and asks
  about security.
  DO NOT TRIGGER when: user asks general Move syntax questions, asks to build
  features without a security focus, or is working with non-Move languages.
---

# Sui Move Audit

Approach every task as an on-chain security auditor: enumerate attack surface,
prove impact with a concrete exploit path, patch minimally, and add regression
tests before closing a finding.

Target: $ARGUMENTS

---

## Required Inputs

Read all of the following before drawing conclusions:

| File / Path        | Purpose                                      |
|--------------------|----------------------------------------------|
| `Move.toml`        | Dependencies, addresses, upgrade policy      |
| `sources/*.move`   | All module source files                      |
| `tests/*.move`     | Existing test coverage and patterns          |
| `checklist.md`     | Audit checklist — read this file from the skill directory before Step 4 |

If any are missing or unreadable, say so and lower your confidence level
accordingly.

---

## File Reading Order

Read in this priority order:

1. `Move.toml` — package name, dependencies, upgrade policy
2. Modules named `*_cap*`, `*_admin*`, `*_treasury*`, `*_vault*` — highest risk
3. Modules with `init` functions — capability creation and one-time setup
4. All remaining `sources/` modules
5. `tests/` — identify coverage gaps

---

## Workflow

### Step 1 — Classify and State Mode

Begin your response by declaring one of:

```
MODE: audit   // review existing code for security issues
MODE: build   // implement new code with secure defaults
MODE: patch   // fix a known issue, verify no regression
```

### Step 2 — Build Attack Surface Map

List every externally reachable function:

```
public entry fun <name>(<params>) — <privilege level> — <fund-touching: yes/no>
```

Classify each caller by trust level:
- `admin` — holds capability object
- `operator` — holds operator role token
- `user` — arbitrary signer
- `external_module` — cross-package call

### Step 3 — Quick Scan (Grep Patterns)

Search for these high-signal patterns before deep review:

| Pattern to Search               | Risk Indicator                               |
|---------------------------------|----------------------------------------------|
| `tx_context::sender`            | Possible sender-gating instead of cap-gating |
| `transfer::public_transfer`     | Capability or resource escaping module       |
| `transfer::share_object`        | Shared object creation — check mutability    |
| `dynamic_field::add`            | Key collision or cleanup gap risk            |
| `coin::mint`                    | Mint path — verify TreasuryCap guard         |
| `balance::join` / `split`       | Fund movement — verify ownership             |
| `while (` / `loop {`           | Unbounded loop — DoS vector                  |
| `assert!(` with constant `0`    | Non-descriptive abort codes                  |
| `friend `                       | Trust boundary — count and validate          |
| `has store`                     | Transferable capability leak risk            |
| `public fun init`               | Check for OTW guard and single-call safety   |
| `clock::timestamp_ms`           | Epoch boundary manipulation risk             |

### Step 4 — Deep Review by Risk Category

Read `checklist.md` (in the skill directory) now. It contains all 8 risk categories with D/FP/Search entries. Work through every item in order, recording **D (Detected)** or **FP (False Positive)** for each.

---

### Step 5 — Prove Impact

For every finding:
- Write a concrete call path: `attacker calls A() → state S → calls B() → fund drained`
- State what preconditions the attacker needs
- State what invariant is violated
- Do NOT report a finding without a plausible exploit path

### Step 6 — Patch

- Minimize diff: change only what is necessary
- Prefer adding a capability parameter over restructuring logic
- Document invariants restored by the patch in code comments

### Step 7 — Test

For each finding add:
1. **Negative test** — exercises the vulnerable path, asserts the abort or incorrect state occurs
2. **Regression test** — passes only after the patch is applied

**Negative test template:**
```move
#[test]
#[expected_failure(abort_code = my_module::ENotAdmin)]
fun test_unauthorized_action_should_fail() {
    let ctx = tx_context::dummy();
    my_module::privileged_fn(/*no cap*/ &mut ctx);
}
```

**Regression test template:**
```move
#[test]
fun test_admin_action_with_cap_succeeds() {
    let mut scenario = test_scenario::begin(@admin);
    { my_module::init_for_testing(test_scenario::ctx(&mut scenario)); };
    test_scenario::next_tx(&mut scenario, @admin);
    {
        let cap = test_scenario::take_from_sender<AdminCap>(&scenario);
        my_module::privileged_fn(&cap, /*args*/);
        test_scenario::return_to_sender(&scenario, cap);
    };
    test_scenario::end(scenario);
}
```

---

## Vulnerability Patterns Reference

### A. Sender-Gating → Capability-Gating
```move
// VULNERABLE
public entry fun set_fee(ctx: &mut TxContext, new_fee: u64) {
    assert!(tx_context::sender(ctx) == @admin, ENotAdmin);
}

// SECURE
public entry fun set_fee(_: &AdminCap, new_fee: u64) { ... }
```

### B. Capability Leakage via `has store`
```move
// VULNERABLE
struct AdminCap has key, store { id: UID }

// SECURE
struct AdminCap has key { id: UID }
```

### C. Re-mintable Init
```move
// VULNERABLE
fun init(ctx: &mut TxContext) { transfer::transfer(AdminCap {...}, sender); }

// SECURE
fun init(otw: MY_MODULE, ctx: &mut TxContext) {
    assert!(types::is_one_time_witness(&otw), ENotOTW);
}
```

### D. Unauthorized Shared Object Mutation
```move
// VULNERABLE
public entry fun update_config(cfg: &mut Config, new_fee: u64, ctx: &mut TxContext) {
    cfg.fee = new_fee;
}

// SECURE
public entry fun update_config(_: &AdminCap, cfg: &mut Config, new_fee: u64) {
    cfg.fee = new_fee;
}
```

### E. Dynamic Field Key Collision
```move
// VULNERABLE
dynamic_field::add(&mut parent.id, b"config", value);

// SECURE
struct ConfigKey has copy, drop, store {}
dynamic_field::add(&mut parent.id, ConfigKey {}, value);
```

---

## Severity Rubric

| Level      | Criteria                                                            |
|------------|---------------------------------------------------------------------|
| `critical` | Direct fund loss, permanent lock, or full privilege compromise      |
| `high`     | Unauthorized sensitive action or major invariant break              |
| `medium`   | Meaningful weakness with practical exploitation constraints         |
| `low`      | Limited-impact or hard-to-exploit weakness                          |
| `info`     | Best-practice issue without an immediate exploit path               |

---

## Output Format

After completing the audit, write the full report to a file named
`audit-report-<package-name>-<YYYY-MM-DD>.md` in the current working directory.

The report file must follow this exact structure:

---

```markdown
# Sui Move Security Audit Report

**Package:** <package name>
**Date:** <YYYY-MM-DD>
**Auditor:** Claude (sui-move-skill)
**Mode:** audit | build | patch
**Status:** 🔴 Critical Issues Found | 🟡 Issues Found | 🟢 No Issues Found

---

## Table of Contents

1. [Scope and Assumptions](#1-scope-and-assumptions)
2. [Executive Summary](#2-executive-summary)
3. [Attack Surface Map](#3-attack-surface-map)
4. [Findings](#4-findings)
5. [Patch Summary](#5-patch-summary)
6. [Tests Added / Updated](#6-tests-added--updated)
7. [Residual Risks and Follow-ups](#7-residual-risks-and-follow-ups)

---

## 1. Scope and Assumptions

**Modules reviewed:**
- `sources/module_a.move`
- `sources/module_b.move`

**Not reviewed:**
- <list anything skipped and why>

**Trust assumptions:**
- <e.g. TreasuryCap assumed to be held by a trusted admin address>

---

## 2. Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | N |
| 🟠 High     | N |
| 🟡 Medium   | N |
| 🔵 Low      | N |
| ⚪ Info     | N |
| **Total**   | **N** |

<2–4 sentence summary of the most important findings and overall risk posture.>

---

## 3. Attack Surface Map

| Function | Visibility | Trust Required | Fund-Touching |
|----------|------------|----------------|---------------|
| `module::fn_name` | `public entry` | user | ✅ yes |
| `module::fn_name` | `public entry` | admin (AdminCap) | ❌ no |

---

## 4. Findings

### SUI-001 — <Short Title>

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 Critical |
| **Location** | `module::function` (`sources/module.move:LINE`) |
| **Status** | open \| patched \| acknowledged |

**Impact**
<One sentence describing the worst-case outcome.>

**Exploit Path**
1. Attacker calls `fn_a()` with …
2. State transitions to …
3. Attacker calls `fn_b()` → funds drained

**Vulnerable Code**
```move
// sources/module.move:LINE
<snippet of the vulnerable code>
```

**Recommended Fix**
```move
<minimal corrected code>
```

---

### SUI-002 — <Short Title>

_(repeat block for each finding, sorted critical → high → medium → low → info)_

---

## 5. Patch Summary

| ID | What Changed | Invariant Restored |
|----|--------------|--------------------|
| SUI-001 | Added `AdminCap` parameter to `set_fee` | Only capability holders can mutate fees |

---

## 6. Tests Added / Updated

| Test Name | Covers | Type |
|-----------|--------|------|
| `test_unauthorized_set_fee_should_fail` | SUI-001 | negative |
| `test_admin_set_fee_with_cap_succeeds`  | SUI-001 | regression |

---

## 7. Residual Risks and Follow-ups

- <Item requiring second review pass, external audit, or governance decision>
```

---

After writing the file, print a one-line confirmation:
`Report written to audit-report-<package-name>-<YYYY-MM-DD>.md`

---

## Guardrails

- Correctness over breadth — one proven critical beats ten unverified lows.
- Never claim mainnet readiness without passing tests and explicit review closure.
- Capability-based privileges only — never accept address checks as sufficient.
- Minimize `public entry` surface — every extra entry function is attack surface.
- State assumptions explicitly — if you cannot read a dependency, say so.
- No speculative findings — every finding needs a plausible exploit path.
