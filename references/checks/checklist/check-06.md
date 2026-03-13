# Time, Oracle, and Market Assumptions

## 6. Time, Oracle, and Market Assumptions

### 6.1 Epoch / Clock Boundary Exploitability

- **Severity:** medium
- **D:** Logic gates on `clock::timestamp_ms` with no grace window and epoch rollover can be exploited by timing transactions
- **FP:** Grace windows, monotonic checks, or delayed effectiveness prevent boundary manipulation
- **Search:** `clock::timestamp_ms` and check for strict `==` or tight boundary comparisons

### 6.2 Oracle Input Integrity Gaps

- **Severity:** high – critical
- **D:** Price or rate from an oracle object is consumed directly without staleness check, bounds, or a deviation guard
- **FP:** Staleness checks, bounds, and a circuit breaker such as maximum deviation per epoch are all present
- **Search:** Oracle object reads feeding into settlement, liquidation, or swap logic
