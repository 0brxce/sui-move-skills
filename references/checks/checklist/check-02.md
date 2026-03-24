# Object Model and Shared Object Safety

## 2. Object Model and Shared Object Safety

### 2.1 Unauthorized Shared Object Mutation

- **D:** A shared object (`transfer::share_object`) is mutated via `&mut` in a function with no capability guard
- **FP:** The function enforces equivalent authorization through a capability, ownership proof, or another non-forgeable control object
- **Search:** `transfer::share_object`, shared object struct types, functions taking `&mut` of those types, then verify authorization in the callee rather than by parameter adjacency alone

### 2.2 Shared Object Contention DoS

- **D:** High-frequency user flows such as swap, deposit, or claim all write to one shared object and spammable transactions can block others
- **FP:** State is partitioned per user, or write contention is bounded and well-documented
- **Search:** `transfer::share_object` and check whether the same object is written in hot paths

### 2.3 Lifecycle Invariant Break (create / update / delete / transfer)

- **D:** An object can be created, transferred, or deleted without updating all invariant fields such as counts, balances, or indices
- **FP:** Every lifecycle transition touches the same invariant set consistently
- **Search:** Functions that call `object::delete` or `transfer::transfer`; verify all bookkeeping is done before the call

### 2.4 Wrap/Unwrap Validation Bypass

- **D:** Wrapping a resource into a container or shared object, or later unwrapping or withdrawing it, skips the ownership or capability checks enforced in the primary flow
- **FP:** Wrap or unwrap helpers enforce identical checks as the main entry functions
- **Search:** wrapper or container helper functions, `dynamic_field::add`, `dynamic_field::remove`, `dynamic_object_field::add`, `dynamic_object_field::remove`, and custom deposit or withdraw helpers for resource-holding objects

### 2.5 Unbounded Shared-State Growth

- **D:** User-reachable flows can append receipts, orders, claims, or metadata into a shared object or its child storage without per-user bounds, pruning, or economic friction
- **FP:** Growth is bounded by deposits, storage rebates, per-user quotas, or explicit cleanup paths that keep operational state under control
- **Search:** `dynamic_field::add`, `table::add`, `bag::add`, shared object mutation in user flows, and whether the write path has bounds or cleanup

### 2.6 Pool / Position Lineage Not Re-Checked

- **D:** A function accepts both a pool-, market-, or vault-like object and a position, receipt, debt bag, or ticket, but never verifies that the child object was created for that exact parent lineage before collecting fees, repaying debt, liquidating, or settling
- **FP:** The child object stores the canonical parent ID, market ID, or equivalent lineage marker, and every maintenance or value-moving path re-checks it before acting
- **Search:** `position`, `pool_object`, `market`, `vault`, `collect_fee`, `liquidate`, `repay`, `settle`, and whether the code compares stored parent IDs or lineage fields against the passed object

### 2.7 Share Namespace or Pool Pairing Not Verified

- **D:** A deleverage, liquidation, repay, or accounting helper accepts a pool, share bag, registry, or share balance whose semantic share namespace can differ from the position or debt state being operated on, allowing a wrong but shape-compatible pool or share container to influence rewards, repayment, or settlement
- **FP:** The flow binds every share bag, registry, or balance to the exact canonical pool, registry, or share type expected by the position, and asserts that pairing before burning, repaying, or distributing value
- **Search:** `SupplyPool`, share bags, debt bags, registry-like objects, and helpers that take both pool-like inputs and position or debt state without lineage or namespace checks
