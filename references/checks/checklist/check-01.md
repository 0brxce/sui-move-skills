# Access Control and Capabilities

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

### 1.3 Re-Issuable Privileged Capability

- **Severity:** critical
- **D:** A module has a reachable function that creates, re-creates, restores, or re-wraps `AdminCap`, `MintCap`, `TreasuryCap`, `UpgradeCap`, or an equivalent privileged object after initialization
- **FP:** The capability is created only during package initialization, or only through a tightly capability-gated migration or recovery path that preserves the singleton invariant
- **Search:** `AdminCap|MintCap|TreasuryCap|UpgradeCap`, constructors returning cap types, `object::new` near cap structs, functions that transfer or return cap objects

### 1.4 Overexposed `public entry` Surface

- **Severity:** medium
- **D:** Admin or maintenance functions such as pause, fee-setting, or allowlist management are `public entry` callable by anyone
- **FP:** Sensitive functions require a capability object parameter; user-facing functions are clearly scoped
- **Search:** `public entry fun` and manually classify each as user, admin, or internal
