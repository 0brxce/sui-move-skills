# Observability and Runtime Defensibility

## 8. Observability and Runtime Defensibility

### 8.1 Missing High-Value Security Events

- **Severity:** info – medium
- **D:** Admin actions, capability transfers, or fund movements do not emit `event::emit`
- **FP:** Every sensitive state change emits a typed event with enough fields for incident reconstruction
- **Search:** Admin or fund-moving functions without `event::emit` calls

### 8.2 Non-Actionable Abort Codes

- **Severity:** info
- **D:** `assert!(cond, 0)` or `assert!(cond, 1)` uses raw numeric literals with no named constant, and error codes are not documented
- **FP:** Every abort uses a named `const E_*: u64 = N` that separates auth, state, input, and accounting failure classes
- **Search:** `assert!(.*,\s*[0-9]` and find raw numeric abort codes
