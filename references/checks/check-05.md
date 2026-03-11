# External Integrations and Upgradeability

## 5. External Integrations and Upgradeability

### 5.1 Unsafe External Module Trust

- **Severity:** medium – high
- **D:** Calls to external packages assume returned values are valid without pre or post invariant checks
- **FP:** Invariants are asserted after external calls, and trust assumptions are explicitly documented in code comments
- **Search:** fully-qualified external calls, adapters around third-party modules, and post-call invariant checks

### 5.2 Unsafe `friend` Trust Boundary

- **Severity:** medium
- **D:** A `friend` module can call internal functions that bypass checks, mint or move privileged objects, or mutate protected state across a trust boundary
- **FP:** Friend modules are part of the same trust domain and only access internals that do not weaken authorization or invariants
- **Search:** `friend ` declarations, `public(friend)` or friend-reachable helpers, and internal functions that skip checks performed by the public surface

### 5.3 Upgrade Policy Risk

- **Severity:** high
- **D:** Source-visible upgrade authority is controlled by a single actor or an insufficiently constrained object, with no code-level governance, delay, or approval checks around upgrade execution
- **FP:** Upgrade authority is wrapped in a governance object, multisig flow, timelock, or similarly constrained control path that matches the stated security model
- **Search:** `UpgradeCap`, `Publisher`, governance or admin objects that store upgrade authority, and functions that transfer or exercise upgrade-related capabilities

### 5.4 Upgrade Migration Invariant Break

- **Severity:** high
- **D:** A schema-changing upgrade leaves old objects missing new required fields and no migration path is provided
- **FP:** Explicit migration entry points or lazy migration patterns handle old object formats, and regression tests cover the old-to-new object lifecycle
- **Search:** migration functions, version fields, schema-dependent branching, versioned objects, and upgrade helpers that transform old state

```move
module demo::migration {
    use sui::object::UID;

    // v1
    public struct Pool has key, store { id: UID, total: u64 }

    // v2 expectation: reward_index must be initialized before claim/settle logic runs.
    // If old Pool objects survive the upgrade without migration, later logic can read
    // an uninitialized semantic state or assume a default that breaks accounting.
    public fun migrate(pool: &mut Pool) {
        // Safe shape after a versioned upgrade:
        // pool.version = 2;
        // pool.reward_index = 1_000_000_000;
    }
}
```
