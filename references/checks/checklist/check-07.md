# Transaction Composition and PTB Safety

## 7. Transaction Composition and PTB Safety

### 7.1 Multi-Step PTB State Bypass

- **D:** Multiple commands in the same PTB can be composed to reuse a ticket, bypass a phase check, consume and re-acquire authority, or otherwise circumvent a state machine that is only safe under single-step assumptions
- **FP:** The flow consumes one-time resources atomically, binds checks to the actual transition being executed, and prevents same-PTB reuse of nonce, ticket, or capability state
- **Search:** ticket, receipt, or nonce patterns; functions that read then set phase or spent flags; flows where command N creates authority that command N+1 can immediately reuse

### 7.2 Emergency Function Overreach

- **D:** Pause, recovery, or admin emergency functions can arbitrarily withdraw user funds or bypass normal restrictions
- **FP:** Emergency paths are minimal, controlled by multisig, and emit events for every action
- **Search:** Functions named `emergency_*`, `pause_*`, or `rescue_*` and verify the scope of allowed actions

### 7.3 Incomplete State-Machine Exhaustion Checks

- **D:** Multi-step workflows validate the current phase on the main path but leave helper paths, cancellation flows, or cleanup functions callable in states where they should be inert
- **FP:** Every state-mutating helper checks the same phase or derives authorization from a consumed one-shot resource
- **Search:** `status`, `phase`, `state`, `paused`, `closed`, and compare checks across create, execute, cancel, settle, and cleanup flows

### 7.4 Contradictory Gate Ordering

- **D:** A front-loaded safety check or shared helper enforces a condition that later business logic explicitly intends to bypass for a special-case flow, making the code contradict the documented design
- **FP:** Pre-checks are parameterized by the actual action being taken, and exceptional flows such as reduce-only, unwind-only, or cleanup-only paths skip only the checks they are meant to bypass
- **Search:** generic `safety_check`, `validate_*`, or `assert_*` helpers called before branch-specific logic, then compare their conditions against documented exceptions like reduce-only, close-only, or emergency-cleanup behavior

### 7.5 Immediate Post-Commit Parameter Changes

- **D:** After users commit funds or become locked into a workflow, a creator or admin can immediately change core economic or execution parameters such as price, cost, prompt, routing, or timelock-relevant settings with no delay, staged activation, or per-request snapshot, leaving later execution to depend on mutable terms rather than the terms users committed under
- **FP:** Sensitive parameter changes are delayed, timelocked, capped, staged, or snapshotted into the user request so already-committed users have a fair chance to react and downstream execution is bound to the original terms
- **Search:** `update_*`, `set_*`, `configure_*`, or prompt and pricing setters that affect already-funded or already-locked positions, then check whether requests, tickets, or orders snapshot the relevant values or keep referencing mutable global state

### 7.6 Lifecycle Authorization Drift

- **D:** Registration, replacement, destruction, or cleanup functions in a workflow module use a weaker authorization rule than the active-use path, allowing stale, unrelated, or owner-only lifecycle actions to bypass the intended state machine
- **FP:** Lifecycle functions enforce the same lineage, ownership, role, and version constraints as the active-use path, and destructive actions are limited to the exact objects they are meant to retire
- **Search:** `register`, `deploy`, `rotate`, `replace`, `destroy`, `remove`, `cleanup`, and compare their authorization and lineage checks against the corresponding execute or verify path

### 7.7 Replayable Signed Workflow Authorization

- **D:** A signed workflow step is bound only to coarse fields such as `user`, `agent`, `epoch`, or a reusable nonce, but not to the exact ticket, object ID, spend amount, or single-use authorization instance, allowing one valid signature to be replayed across multiple objects, requests, or later re-funding windows
- **FP:** Every signed action is bound to the exact object or ticket being consumed, the economic amount or effect being authorized, and a nonce or spent marker that is unique for that authorization instance and cannot be reused across same-epoch or same-user requests
- **Search:** signed payloads that include `nonce`, `epoch`, `request_id`, `ticket`, `attack`, `receipt`, or `amount`; compare the signed fields against the actual object consumed and ask whether two distinct objects can share the same signature domain

### 7.8 Emergency or Recovery Path Disabled by Its Own Pause Gate

- **D:** A pause flips a global gate (version sentinel, `paused` flag) that all normal flows check, but an emergency withdraw, rescue, or recovery function also runs that same gate, so the recovery path aborts exactly while the protocol is paused — when it is most needed
- **FP:** Recovery and emergency functions use a dedicated "is paused" assertion (or no version gate at all) so they remain callable during the paused state, while still requiring the proper capability
- **Search:** `emergency_*`, `rescue_*`, `emergent_*`, `recover_*`, `withdraw` functions and whether they call the same `checked_version`/`checked_package_version`/`assert_not_paused` helper that the pause action trips; trace the paused state value through that helper and confirm the recovery path is still reachable

### 7.9 Non-Atomic Multi-Page Update of a Global Accounting Denominator

- **D:** A paginated or multi-transaction admin update writes a global regime value (effective range, price anchor, rate) and the shared denominator (`total_share`, total stake) up front, but refreshes per-member contributions only `limit` at a time, leaving a window where settlement uses a mixed denominator: some members at new weight, others at stale weight
- **FP:** The regime change and all dependent member weights are updated atomically, or settlement is frozen/snapshotted until pagination completes, so no reward or interest accrues against a mixed denominator
- **Search:** paginated `update_*`/`migrate_*` loops with a `limit`/cursor that assign a global field (range, `sqrt_price`, `total_share`) before the loop and update member entries incrementally; check whether harvest/settle is reachable between pages and treat the mixed-denominator window as a validated consistency issue, not merely unvalidated
