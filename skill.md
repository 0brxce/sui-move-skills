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

Work through each category below. Record **D (Detected)** or **FP (False Positive)** for each item.

---

#### 1. Access Control and Capability Model

**1.1 Sender-Gating Instead of Capability-Gating** — `high–critical`
- D: Privileged function checks `tx_context::sender(ctx) == @some_address`
- FP: Every privileged mutation requires a non-forgeable capability object passed as parameter
- Search: `tx_context::sender` near `assert!` in functions that mutate state

**1.2 Capability Leakage (`has store` / transfer)** — `high`
- D: `AdminCap`, `MintCap`, or privileged struct has `store` ability, or passed to `public_transfer`
- FP: Capability has only `key`; module controls all transfer paths explicitly
- Search: `struct.*Cap.*has.*store`, `public_transfer.*Cap`

**1.3 Re-Mintable Privileged Capability** — `critical`
- D: `init` is `public`, lacks OTW guard, or can be called again via exported wrapper
- FP: `init` is private, takes OTW parameter, asserts `types::is_one_time_witness`
- Search: `public fun init`, `fun init` without `otw` parameter

**1.4 Overexposed `public entry` Surface** — `medium`
- D: Admin/maintenance functions are `public entry` callable by anyone
- FP: Sensitive functions require a capability object; user-facing functions are clearly scoped
- Search: List all `public entry fun` and classify each

---

#### 2. Object Model and Shared Object Safety

**2.1 Unauthorized Shared Object Mutation** — `high–critical`
- D: Shared object mutated via `&mut` with no capability guard
- FP: All `&mut SharedObject` require an accompanying capability parameter
- Search: `&mut` params of shared object type without adjacent cap parameter

**2.2 Shared Object Contention DoS** — `medium`
- D: High-frequency flows all write to one shared object
- FP: State is partitioned per user or write contention is bounded
- Search: `transfer::share_object` — check if same object written in hot paths

**2.3 Lifecycle Invariant Break** — `high`
- D: Object created/transferred/deleted without updating all invariant fields
- FP: Every lifecycle transition touches the same invariant set consistently
- Search: `object::delete`, `transfer::transfer` — verify all bookkeeping done before call

**2.4 Wrap/Unwrap Validation Bypass** — `high`
- D: Wrapping/unwrapping skips ownership/capability checks enforced in primary flow
- FP: Wrap/unwrap enforce identical checks as main entry functions
- Search: `object::wrap`, dynamic_field add/remove of resource types

---

#### 3. Token, Treasury, and Accounting

**3.1 Unauthorized Mint (`TreasuryCap` Misuse)** — `critical`
- D: `coin::mint` reachable without `TreasuryCap`, or `TreasuryCap` in shared object accessible to all
- FP: Mint is capability-gated and `TreasuryCap` held by controlled address or locked in governed object
- Search: `coin::mint`, `TreasuryCap` storage location

**3.2 Unauthorized Burn / Withdraw** — `critical`
- D: Burn or withdraw path doesn't verify caller owns the resource
- FP: Ownership enforced via `object::id` comparison or resource passed by value
- Search: `coin::burn`, `balance::split`, `coin::take` — check caller authority

**3.3 Dual-Ledger Drift** — `high`
- D: `Balance<T>` and an internal `u64` accounting field can diverge
- FP: Single source of truth; derived values computed from `balance::value()` on read
- Search: Fields named `total_*`, `balance_*` as `u64` alongside real `Balance<T>` fields

**3.4 Amount Boundary / Replay Gaps** — `medium–high`
- D: Missing zero-amount checks, min/max bounds, duplicate claim protection
- FP: Every entrypoint asserts non-zero input, enforces bounds, uses ID-based replay protection
- Search: Reward/claim functions missing deduplication; `assert!(amount > 0`

**3.5 Manipulable Fee / Reward Math** — `medium`
- D: Rounding favors user; reward snapshot after balance change; integer division loses dust
- FP: Fees round up (protocol-favorable); reward snapshot taken before state change
- Search: `/` operator in fee/reward calculations — verify rounding direction

---

#### 4. Data Structures and Storage Semantics

**4.1 Dynamic Field Key Collision / Confusion** — `high`
- D: Raw bytes or string literals as dynamic field keys; two modules use same key string
- FP: Keys are typed structs unique to each module/domain
- Search: `dynamic_field::add.*b"`, `dynamic_object_field::add.*b"`

**4.2 Dynamic Field Cleanup Gaps** — `medium`
- D: Parent object deleted without removing dynamic child fields
- FP: Teardown removes all child fields before deleting parent
- Search: `object::delete` — check for preceding `dynamic_field::remove` calls

---

#### 5. External Integrations and Upgradeability

**5.1 Unsafe External Module Trust** — `medium–high`
- D: External package calls with no pre/post invariant checks on returned values
- FP: Invariants asserted after external calls; trust assumptions documented in comments
- Search: Cross-package function calls — identify assumptions on return values

**5.2 Over-Broad `friend` Boundary** — `medium`
- D: More than 2–3 modules listed as `friend`; friend modules span different trust domains
- FP: Friend list minimal (≤ 2), same package, same trust level
- Search: `friend ` declarations — list all and verify trust domain

**5.3 Upgrade Policy Risk** — `high`
- D: `UpgradeCap` held by single EOA; upgrade policy `compatible` or `additive` without governance
- FP: `UpgradeCap` wrapped in governance object or multisig; policy matches security model
- Search: `UpgradeCap` storage location; `Move.toml` upgrade_policy field

**5.4 Upgrade Migration Invariant Break** — `high`
- D: Schema-changing upgrade leaves old objects missing new required fields
- FP: Explicit migration entry points or lazy migration patterns handle old formats
- Search: New fields added to existing structs — verify backward compatibility

---

#### 6. Time, Oracle, and Market Assumptions

**6.1 Epoch / Clock Boundary Exploitability** — `medium`
- D: Logic gates on `clock::timestamp_ms` with no grace window; strict boundary comparisons
- FP: Grace windows, monotonic checks, or delayed effectiveness prevent boundary manipulation
- Search: `clock::timestamp_ms` — check for `==` or tight boundary comparisons

**6.2 Oracle Input Integrity Gaps** — `high–critical`
- D: Price/rate from oracle consumed directly without staleness check, bounds, or deviation guard
- FP: Staleness, bounds, and circuit-breaker checks all present
- Search: Oracle object reads feeding into settlement, liquidation, or swap logic

---

#### 7. Transaction Composition and PTB Safety

**7.1 Multi-Step PTB State Bypass** — `high`
- D: Check passes in step N because state not committed yet; later step exploits inconsistency
- FP: Checks bind to committed final state; or one-time resource consumed atomically
- Search: Functions that read a flag/nonce and set it in the same transaction

**7.2 Emergency Function Overreach** — `high`
- D: Pause/recovery functions can arbitrarily withdraw user funds or bypass normal restrictions
- FP: Emergency paths minimal (pause only), controlled by multisig, emit events
- Search: `emergency_*`, `pause_*`, `rescue_*` — verify scope of allowed actions

---

#### 8. Observability and Runtime Defensibility

**8.1 Missing High-Value Security Events** — `info–medium`
- D: Admin actions, config changes, or fund movements lack `event::emit`
- FP: Every sensitive state change emits typed event with fields for incident reconstruction
- Search: Admin/fund-moving functions without `event::emit` calls

**8.2 Non-Actionable Abort Codes** — `info`
- D: `assert!(cond, 0)` or numeric literals; no named error constants
- FP: Every abort uses `const E_*: u64 = N` separating auth/state/input/accounting failures
- Search: `assert!(.*,\s*[0-9]` — find raw numeric abort codes

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
