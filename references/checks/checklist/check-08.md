# Observability and Runtime Defensibility

## 8. Observability and Runtime Defensibility

### 8.1 Missing High-Value Security Events

- **D:** Admin actions, capability transfers, or fund movements do not emit `event::emit`
- **FP:** Every sensitive state change emits a typed event with enough fields for incident reconstruction
- **Search:** Admin or fund-moving functions without `event::emit` calls. Build a matrix of every public value-moving or state-changing function vs the event it emits, and flag any function that emits none — especially when a sibling operation in the same module does (e.g., `deposit`/`withdraw`/`harvest` emit but `collect_fee`/`close_position` do not, or `emergency_pause`/`emergency_unpause` change global state silently)

### 8.2 Non-Actionable Abort Codes

- **D:** `assert!(cond, 0)` or `assert!(cond, 1)` uses raw numeric literals with no named constant, and error codes are not documented
- **FP:** Every abort uses a named `const E_*: u64 = N` that separates auth, state, input, and accounting failure classes
- **Search:** `assert!(.*,\s*[0-9]` and find raw numeric abort codes

### 8.3 Public Event Forgery Surface

- **D:** A user-reachable function exists only to emit protocol-looking events, or accepts arbitrary caller-controlled event fields with no authorization or state binding
- **FP:** Event emitters are reachable only from the real state transition they describe, and privileged or protocol-identity events require the same authorization as the underlying action
- **Search:** `event::emit` wrappers, event-only entrypoints, and functions that accept arbitrary IDs, amounts, or actor fields without mutating the corresponding state

### 8.4 Event-State Mismatch

- **D:** An event is emitted outside the branch where the underlying action actually occurs, or omits the concrete post-state needed to reconstruct what really happened
- **FP:** Events are emitted only after the successful state mutation or transfer they describe, and their fields match the effective amounts, recipients, and status transitions
- **Search:** `event::emit` placed before guarded transfers, outside `if value > 0` branches, or alongside stale pre-update fields rather than actual post-update values

### 8.5 Event Field Not Covered by Signed or Trusted Inputs

- **D:** An event includes a prompt, message, route, or other security-relevant field that is neither derived from committed state nor covered by the signed or authenticated payload used for the action
- **FP:** Security-relevant event fields are either reconstructed from trusted state or explicitly included in the signed or otherwise authenticated input domain
- **Search:** signed action flows, emitted prompt or message fields, and differences between the verified payload fields and the values later emitted in events
