# Time, Oracle, and Market Assumptions

## 6. Time, Oracle, and Market Assumptions

### 6.1 Epoch / Clock Boundary Exploitability

- **D:** Logic gates on `clock::timestamp_ms` with no grace window and epoch rollover can be exploited by timing transactions
- **FP:** Grace windows, monotonic checks, or delayed effectiveness prevent boundary manipulation
- **Search:** `clock::timestamp_ms` and check for strict `==` or tight boundary comparisons

### 6.2 Oracle Input Integrity Gaps

- **D:** Price or rate from an oracle object is consumed directly without staleness check, bounds, or a deviation guard
- **FP:** Staleness checks, bounds, and a circuit breaker such as maximum deviation per epoch are all present
- **Search:** Oracle object reads feeding into settlement, liquidation, or swap logic

### 6.3 Timestamp or Oracle Diagnostics Gaps

- **D:** Time- or oracle-sensitive state transitions do not persist enough metadata to reconstruct which timestamp, epoch, round, or price version was used during settlement
- **FP:** Events or state fields record the effective clock or oracle inputs for later verification and incident response
- **Search:** settlement and pricing flows using `clock::timestamp_ms` or oracle reads, and whether the chosen inputs are emitted or stored
