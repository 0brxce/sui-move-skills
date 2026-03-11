# Object Model and Shared Object Safety

## 2. Object Model and Shared Object Safety

### 2.1 Unauthorized Shared Object Mutation

- **Severity:** high – critical
- **D:** A shared object (`transfer::share_object`) is mutated via `&mut` in a function with no capability guard
- **FP:** The function enforces equivalent authorization through a capability, ownership proof, or another non-forgeable control object
- **Search:** `transfer::share_object`, shared object struct types, functions taking `&mut` of those types, then verify authorization in the callee rather than by parameter adjacency alone

### 2.2 Shared Object Contention DoS

- **Severity:** medium
- **D:** High-frequency user flows such as swap, deposit, or claim all write to one shared object and spammable transactions can block others
- **FP:** State is partitioned per user, or write contention is bounded and well-documented
- **Search:** `transfer::share_object` and check whether the same object is written in hot paths

### 2.3 Lifecycle Invariant Break (create / update / delete / transfer)

- **Severity:** high
- **D:** An object can be created, transferred, or deleted without updating all invariant fields such as counts, balances, or indices
- **FP:** Every lifecycle transition touches the same invariant set consistently
- **Search:** Functions that call `object::delete` or `transfer::transfer`; verify all bookkeeping is done before the call

### 2.4 Wrap/Unwrap Validation Bypass

- **Severity:** high
- **D:** Wrapping a resource into a container or shared object, or later unwrapping or withdrawing it, skips the ownership or capability checks enforced in the primary flow
- **FP:** Wrap or unwrap helpers enforce identical checks as the main entry functions
- **Search:** wrapper or container helper functions, `dynamic_field::add`, `dynamic_field::remove`, `dynamic_object_field::add`, `dynamic_object_field::remove`, and custom deposit or withdraw helpers for resource-holding objects

```move
module demo::vault_wrap {
    use sui::object::{Self, UID};

    public struct Position has key, store { id: UID, owner: address, amount: u64 }
    public struct Vault has key, store { id: UID }

    // Bug: direct wrap path never checks sender == position.owner.
    public fun wrap(vault: &mut Vault, position: Position) {
        // dynamic_object_field::add(&mut vault.id, b"position", position)
    }

    // Safe shape: require the same auth check used in the normal withdraw path.
    public fun wrap_checked(vault: &mut Vault, position: Position, sender: address) {
        assert!(sender == position.owner, 0);
        // dynamic_object_field::add(&mut vault.id, PositionKey {}, position)
    }
}
```
