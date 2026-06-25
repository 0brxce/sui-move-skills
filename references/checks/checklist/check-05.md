# External Integrations and Upgradeability

## 5. External Integrations and Upgradeability

### 5.1 Unsafe External Module Trust

- **D:** Calls to external packages assume returned values are valid without pre or post invariant checks
- **FP:** Invariants are asserted after external calls, and trust assumptions are explicitly documented in code comments
- **Search:** fully-qualified external calls, adapters around third-party modules, and post-call invariant checks

### 5.2 Unsafe `friend` Trust Boundary

- **D:** A `friend` module can call internal functions that bypass checks, mint or move privileged objects, or mutate protected state across a trust boundary
- **FP:** Friend modules are part of the same trust domain and only access internals that do not weaken authorization or invariants
- **Search:** `friend ` declarations, `public(friend)` or friend-reachable helpers, and internal functions that skip checks performed by the public surface

### 5.3 Upgrade Policy Risk

- **D:** Source-visible upgrade authority is controlled by a single actor or an insufficiently constrained object, with no code-level governance, delay, or approval checks around upgrade execution
- **FP:** Upgrade authority is wrapped in a governance object, multisig flow, timelock, or similarly constrained control path that matches the stated security model
- **Search:** `UpgradeCap`, `Publisher`, governance or admin objects that store upgrade authority, and functions that transfer or exercise upgrade-related capabilities

### 5.4 Upgrade Migration Invariant Break

- **D:** A schema-changing upgrade leaves old objects missing new required fields and no migration path is provided
- **FP:** Explicit migration entry points or lazy migration patterns handle old object formats, and regression tests cover the old-to-new object lifecycle
- **Search:** migration functions, version fields, schema-dependent branching, versioned objects, and upgrade helpers that transform old state

### 5.5 Undocumented External Trust Assumption

- **D:** Critical logic depends on an external package, privileged operator, or upgrade actor, but the trust assumption is not asserted in code comments, invariants, or wrapper checks near the call site
- **FP:** The trust model is explicit in code, enforced by wrapper assertions, or isolated to a narrow adapter that documents expected guarantees
- **Search:** fully-qualified external calls, upgrade helpers, governance hooks, and adjacent comments or postcondition checks explaining the trusted assumption

### 5.6 Overexposed Framework or Helper Module Surface

- **D:** A low-level framework, math, vault, or utility module exposes `public` functions that bypass the validation, policy, or lifecycle checks expected at the higher-level entry surface
- **FP:** Internal building blocks are restricted with `public(package)`, `friend`, or equivalent wrappers, and any intentionally public helper is stateless or safe in isolation
- **Search:** foundational modules with many `public fun` declarations, especially vault, authority, math, settlement, or state helpers that can be called without the normal coordinator flow

### 5.7 Deployment-Dependent Trust Boundary Weakness

- **D:** The code accepts any object, enclave, signer, assistant, or external actor that satisfies a broad technical predicate such as matching PCRs, type shape, or config version, even though the intended security model appears to require a narrower, uniquely controlled trust domain
- **FP:** The code binds trust to a specific authorized registry, owner set, canonical object ID, or lifecycle-controlled allowlist rather than relying on deployment discipline alone
- **Search:** registration and acceptance rules for enclaves, assistants, signers, or external modules; look for broad predicates like measurement match, version comparison, or type compatibility without a narrower authorized identity binding

### 5.8 Wrong or Caller-Controlled Argument Passed to External Call

- **D:** A value forwarded to an external call as a limit, amount, recipient, or deadline is built from the wrong source — e.g., a zero-initialized container coin's own `coin::value()` used as `amount_max`, the caller's balance used as a withdrawal cap, or a sibling function that hardcodes the correct value while this one does not — silently producing a no-op, under-withdrawal, or misrouted transfer
- **FP:** Each forwarded argument is derived from the intended source (full pending amount, `0xFFFFFFFFFFFFFFFF`/`u64::MAX` for "collect all", the real recipient), and sibling functions performing the same operation pass the same argument the same way
- **Search:** external calls taking `amount_max`, `amount`, `limit`, `recipient`, `deadline`; check whether any is `coin::value(&container)` of a caller-supplied or zero coin, and diff against sibling collectors/withdrawers (e.g., `collect_fee` vs `collect_clmm_reward`) that pass `0xFFFFFFFFFFFFFFFF` or the full owed amount

### 5.9 Unsatisfied Callee Precondition on External Lifecycle Calls

- **D:** Code calls an external `burn`, `destroy`, `close`, `settle`, or `repay` that asserts its target is fully cleared (zero owed fees, zero owed rewards, zero residual liquidity, zero debt), but the caller does not drain or settle every such field first, so the call aborts whenever the un-cleared field is non-zero (often making the path always revert on active positions)
- **FP:** The caller collects or settles every component the callee requires to be zero — all fee token types, all reward token types (including those reachable only with extra generic type parameters), and residual liquidity — immediately before the destructive call
- **Search:** external `burn`/`destroy`/`close` calls; read the callee's `assert!(... == 0, E*Cleared)` checks (liquidity, `tokens_owed_a/b`, per-reward `amount_owed`) and confirm a matching `collect_*`/`decrease_*` precedes the call for every field and every reward type. When `decrease_liquidity` itself re-accrues fees/rewards, verify the collect happens after it

## Reasoning About Absent or Unreadable Dependencies

When a dependency package is absent, unbuildable, or only available as bytecode, do not stop at a caveat and skip the boundary. Reason from the visible call site instead:

- For every argument passed into the external call, identify its source and whether it is the value the callee expects (see 5.8). A wrong-source argument is provable from the caller alone.
- For every external `burn`/`destroy`/`close`/`settle`/`swap`, state the conventional post-condition or clear-check such a callee enforces, and verify the caller satisfies it (see 5.9). A CLMM `burn` that requires a fully-cleared position is a standard contract.
- Only mark the boundary `Unknown` after this reasoning. If the call site clearly violates the conventional callee contract or passes a wrong argument, validate it as a finding rather than deferring on "dependency not readable."
