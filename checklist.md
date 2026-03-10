# Sui Move Audit Checklist

Format per item:
- **D (Detect):** what the vulnerable pattern looks like
- **FP (False Positive):** what makes it safe
- **Search:** grep / code pattern to locate candidates
- **Severity hint:** typical severity when confirmed

---

## 1. Access Control and Capability Model

### 1.1 Sender-Gating Instead of Capability-Gating
- **Severity:** high – critical
- **D:** Privileged function checks `tx_context::sender(ctx) == @some_address`
- **FP:** Every privileged mutation requires a non-forgeable capability object passed as parameter
- **Search:** `tx_context::sender` near `assert!` in any function that mutates state

### 1.2 Capability Leakage (`has store` / transfer)
- **Severity:** high
- **D:** `AdminCap`, `MintCap`, or any privileged struct has `store` ability, or is passed to `transfer::public_transfer`
- **FP:** Capability has only `key`; module controls all transfer paths explicitly
- **Search:** `struct.*Cap.*has.*store`, `public_transfer.*Cap`

### 1.3 Re-Mintable Privileged Capability
- **Severity:** critical
- **D:** `init` function is `public`, lacks an OTW (`one_time_witness`) guard, or can be called again via an exported wrapper
- **FP:** `init` is private, takes OTW parameter, and `assert!(types::is_one_time_witness(&otw))`
- **Search:** `public fun init`, `fun init` without `otw` parameter

### 1.4 Overexposed `public entry` Surface
- **Severity:** medium
- **D:** Admin/maintenance functions (pause, fee-setting, allowlist management) are `public entry` callable by anyone
- **FP:** Sensitive functions require a capability object parameter; user-facing functions are clearly scoped
- **Search:** `public entry fun` — list all, manually classify each as user / admin / internal

---

## 2. Object Model and Shared Object Safety

### 2.1 Unauthorized Shared Object Mutation
- **Severity:** high – critical
- **D:** A shared object (`transfer::share_object`) is mutated via `&mut` in a function with no capability guard
- **FP:** All `&mut SharedObject` references require an accompanying capability parameter
- **Search:** `&mut` parameters of shared object type without adjacent cap parameter

### 2.2 Shared Object Contention DoS
- **Severity:** medium
- **D:** High-frequency user flows (swap, deposit, claim) all write to one shared object; spammable transactions can block others
- **FP:** State is partitioned per user, or write contention is bounded and well-documented
- **Search:** `transfer::share_object` — check if same object is written in hot paths

### 2.3 Lifecycle Invariant Break (create / update / delete / transfer)
- **Severity:** high
- **D:** An object can be created, transferred, or deleted without updating all invariant fields (counts, balances, indices)
- **FP:** Every lifecycle transition touches the same invariant set consistently
- **Search:** Functions that call `object::delete` or `transfer::transfer` — verify all bookkeeping is done before the call

### 2.4 Wrap/Unwrap Validation Bypass
- **Severity:** high
- **D:** Wrapping (`object::wrap`) or unwrapping a resource skips the ownership/capability checks enforced in the primary flow
- **FP:** Wrap/unwrap helpers enforce identical checks as the main entry functions
- **Search:** `object::wrap`, dynamic_field add/remove of resource types

---

## 3. Token, Treasury, and Accounting

### 3.1 Unauthorized Mint (`TreasuryCap` Misuse)
- **Severity:** critical
- **D:** `coin::mint` is reachable without holding `TreasuryCap`, or `TreasuryCap` is stored in a shared object accessible to all
- **FP:** Mint is capability-gated and `TreasuryCap` is held by a controlled address or locked in a governed object
- **Search:** `coin::mint`, `TreasuryCap` storage location

### 3.2 Unauthorized Burn / Withdraw
- **Severity:** critical
- **D:** Burn or withdraw path does not verify that the caller owns the resource being burned
- **FP:** Ownership is enforced via `object::id` comparison or the resource is passed by value (Move linear types ensure caller had it)
- **Search:** `coin::burn`, `balance::split`, `coin::take` — check caller authority

### 3.3 Dual-Ledger Drift (`Balance<T>` vs custom ledger)
- **Severity:** high
- **D:** On-chain `Balance<T>` and an internal accounting field (e.g. `total_deposited: u64`) can diverge due to missed update paths
- **FP:** Single source of truth; derived values computed from `balance::value()` on read rather than stored separately
- **Search:** Fields named `total_*`, `balance_*`, `amount_*` as `u64` alongside real `Balance<T>` fields

### 3.4 Amount Boundary / Replay Gaps
- **Severity:** medium – high
- **D:** Missing checks for: zero amounts, min/max bounds, duplicate reward claims, or repeated voucher redemptions
- **FP:** Every entrypoint asserts non-zero input, enforces bounds, and uses a consumed/spent flag or ID-based replay protection
- **Search:** `assert!(amount > 0`, reward/claim functions missing ID deduplication

### 3.5 Manipulable Fee / Reward Math
- **Severity:** medium
- **D:** Rounding direction favors user; reward update happens after balance change; integer division loses dust that accumulates to an attacker
- **FP:** Fees round up (protocol-favorable); reward snapshot is taken before any state change; math order is documented
- **Search:** `/` operator in fee/reward calculations — verify rounding direction

---

## 4. Data Structures and Storage Semantics

### 4.1 Dynamic Field Key Collision / Confusion
- **Severity:** high
- **D:** Raw bytes or string literals used as dynamic field keys; two modules use the same key string on the same parent object
- **FP:** Keys are typed structs unique to each module/domain; no raw byte keys in shared parent objects
- **Search:** `dynamic_field::add.*b"`, `dynamic_object_field::add.*b"`

### 4.2 Dynamic Field Cleanup Gaps
- **Severity:** medium
- **D:** Parent object is deleted or closed but dynamic child fields are not removed first — leaked storage
- **FP:** Teardown function iterates and removes all child fields before deleting the parent; or a known cleanup step is documented
- **Search:** `object::delete` — check for preceding `dynamic_field::remove` calls

---

## 5. External Integrations and Upgradeability

### 5.1 Unsafe External Module Trust
- **Severity:** medium – high
- **D:** Calls to external packages assume returned values are valid without pre/post invariant checks
- **FP:** Invariants are asserted after external calls; trust assumptions are explicitly documented in code comments
- **Search:** Cross-package function calls — identify what assumptions are made on return values

### 5.2 Over-Broad `friend` Boundary
- **Severity:** medium
- **D:** More than 2-3 modules are listed as `friend`; friend modules span different trust domains
- **FP:** Friend list is minimal (ideally ≤ 2), same package, same trust level
- **Search:** `friend ` declarations — list all and verify trust domain

### 5.3 Upgrade Policy Risk
- **Severity:** high
- **D:** `UpgradeCap` is held by a single EOA, not locked behind multisig or timelock; upgrade policy is `compatible` or `additive` without governance
- **FP:** `UpgradeCap` is wrapped in a governance object or multisig; upgrade policy matches stated security model
- **Search:** `UpgradeCap` storage — `Move.toml` `[package]` upgrade_policy field

### 5.4 Upgrade Migration Invariant Break
- **Severity:** high
- **D:** A schema-changing upgrade leaves old objects missing new required fields; no migration path is provided
- **FP:** Explicit migration entry points or lazy migration patterns handle old object formats; regression tests cover old → new object lifecycle
- **Search:** New fields added to existing structs in `patch` / `build` mode — verify backward compatibility

---

## 6. Time, Oracle, and Market Assumptions

### 6.1 Epoch / Clock Boundary Exploitability
- **Severity:** medium
- **D:** Logic gates on `clock::timestamp_ms` with no grace window; epoch rollover can be exploited by timing transactions
- **FP:** Grace windows (e.g. ±30s), monotonic checks, or delayed effectiveness prevent boundary manipulation
- **Search:** `clock::timestamp_ms` — check for strict `==` or tight boundary comparisons

### 6.2 Oracle Input Integrity Gaps
- **Severity:** high – critical
- **D:** Price or rate from an oracle object is consumed directly without staleness check, min/max bounds, or deviation guard
- **FP:** Staleness (timestamp delta), bounds (`assert!(price > MIN_PRICE)`), and circuit-breaker (max deviation per epoch) are all present
- **Search:** Oracle object reads feeding into settlement, liquidation, or swap logic

---

## 7. Transaction Composition and PTB Safety

### 7.1 Multi-Step PTB State Bypass
- **Severity:** high
- **D:** A check passes in step N of a PTB because state hasn't been committed yet; a later step in the same PTB exploits the inconsistent state
- **FP:** Checks bind to committed final state; or a one-time resource (ticket) is consumed atomically, preventing double-use within a PTB
- **Search:** Functions that read a flag/nonce and set it in the same transaction — verify the read and write are atomic

### 7.2 Emergency Function Overreach
- **Severity:** high
- **D:** Pause/recovery/admin emergency functions can arbitrarily withdraw user funds or bypass normal restrictions
- **FP:** Emergency paths are minimal (pause only, no fund movement), controlled by multisig, and emit events for every action
- **Search:** Functions named `emergency_*`, `pause_*`, `rescue_*` — verify scope of allowed actions

---

## 8. Observability and Runtime Defensibility

### 8.1 Missing High-Value Security Events
- **Severity:** info – medium
- **D:** Admin actions (config change, pause), capability transfers, or fund movements do not emit `event::emit`
- **FP:** Every sensitive state change emits a typed event with enough fields for incident reconstruction
- **Search:** Admin/fund-moving functions without `event::emit` calls

### 8.2 Non-Actionable Abort Codes
- **Severity:** info
- **D:** `assert!(cond, 0)` or `assert!(cond, 1)` — numeric literals with no named constant; error codes are not documented
- **FP:** Every abort uses a named `const E_*: u64 = N` that separates auth / state / input / accounting failure classes
- **Search:** `assert!(.*,\s*[0-9]` — find raw numeric abort codes
