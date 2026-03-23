# Access Control and Capabilities

## 1. Access Control and Capability Model

### 1.1 Sender-Gating Instead of Capability-Gating

- **D:** Privileged function checks `tx_context::sender(ctx) == @some_address`
- **FP:** Every privileged mutation requires a non-forgeable capability object passed as parameter
- **Search:** `tx_context::sender` near `assert!` in any function that mutates state

### 1.2 Capability Leakage (`has store` / transfer)

- **D:** `AdminCap`, `MintCap`, or any privileged struct has `store` ability, or is passed to `transfer::public_transfer`
- **FP:** Capability has only `key`; module controls all transfer paths explicitly
- **Search:** `struct.*Cap.*has.*store`, `public_transfer.*Cap`

### 1.3 Re-Issuable Privileged Capability

- **D:** A module has a reachable function that creates, re-creates, restores, or re-wraps `AdminCap`, `MintCap`, `TreasuryCap`, `UpgradeCap`, or an equivalent privileged object after initialization
- **FP:** The capability is created only during package initialization, or only through a tightly capability-gated migration or recovery path that preserves the singleton invariant
- **Search:** `AdminCap|MintCap|TreasuryCap|UpgradeCap`, constructors returning cap types, `object::new` near cap structs, functions that transfer or return cap objects

### 1.4 Overexposed `public entry` Surface

- **D:** Admin or maintenance functions such as pause, fee-setting, or allowlist management are `public entry` callable by anyone
- **FP:** Sensitive functions require a capability object parameter; user-facing functions are clearly scoped
- **Search:** `public entry fun` and manually classify each as user, admin, or internal

### 1.5 Over-Broad Privileged Capability Scope

- **D:** One privileged capability or admin object can perform many unrelated actions such as pausing, fee changes, treasury withdrawal, and upgrade control with no internal role separation
- **FP:** The broad capability scope is an intentional governance design with explicit trust assumptions, constrained wrappers, or documented multisig procedures
- **Search:** `struct.*Cap`, admin entrypoints, and whether the same capability type gates unrelated privileged functions

### 1.6 Signed Intent Missing Domain Binding

- **D:** A signed payload is checked for cryptographic validity but is not bound to the actual caller, intended recipient, authorized object ID, or executor identity, allowing front-running, signer confusion, or arbitrary actor substitution
- **FP:** The signed message commits to the caller or recipient, relevant object IDs, operation type, and any unique nonce or expiry needed to prevent reuse outside the intended context
- **Search:** signature verification helpers, signed registration or claim flows, and whether the signed fields include `sender`, recipient, object IDs, role IDs, and operation-specific context

### 1.7 Witnessless Privileged Capability Creation

- **D:** A privileged capability, config authority, or admin object can be created from a public type parameter or generic path without a one-time witness, singleton guard, or equivalent module-controlled proof
- **FP:** Capability creation requires a one-time witness, module-owned singleton state, or another non-forgeable proof that ties minting authority to the defining module
- **Search:** constructors for `*Cap`, `Admin`, `Config`, or authority objects that accept generic type parameters, witness-like values, or publicly reachable initialization helpers

### 1.8 Registry-Backed Role Not Verified

- **D:** A function accepts a role, assistant, manager, or similar capability-like input but does not verify that the holder is still present in the authoritative registry or allowlist that defines active authorization
- **FP:** The call checks both possession of the role object and current membership or status in the registry, table, or config that grants that role operational authority
- **Search:** privileged calls that accept helper caps, assistant objects, signer-like handles, or role IDs, then compare them against authoritative role lists, registries, or config objects

### 1.9 Generic Capability Factory Combined with Generic Acceptance

- **D:** One module exposes a public generic constructor for `Cap<T>`, `Config<T>`, `Authority<T>`, or equivalent privileged objects, while another reachable module accepts arbitrary `T`-scoped caps, configs, or external objects without binding them to a canonical registry, witness lineage, or unique trusted type
- **FP:** Generic capability creation is restricted to module-owned witnesses or singleton state, and any downstream generic verifier binds accepted objects to a canonical registry, lineage, or explicitly trusted `T`
- **Search:** `new_cap<T>`, generic config or authority constructors, and downstream functions that accept `Cap<T>`, `Config<T>`, `Enclave<T>`, signer-like generic objects, or type-parameterized privileged inputs

```move
module demo::generic_caps {
    use sui::object::UID;

    public struct Cap<T> has key, store { id: UID }
    public struct Worker<T> has key, store { id: UID }

    // Bug surface A: anyone can mint a T-scoped privileged object.
    public fun new_cap<T: drop>(ctx: &mut TxContext): Cap<T> {
        Cap { id: object::new(ctx) }
    }

    // Bug surface B: downstream code accepts any Worker<T> paired with Cap<T>
    // but never checks a canonical registry or witness lineage for T.
    public fun run_job<T>(_cap: &Cap<T>, _worker: &Worker<T>) {
        // privileged action
    }
}
```
