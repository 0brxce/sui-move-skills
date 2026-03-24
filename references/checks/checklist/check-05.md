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
