# Time, Oracle, and Market Assumptions

## 6. Time, Oracle, and Market Assumptions

### 6.1 Epoch / Clock Boundary Exploitability

- **D:** Logic gates on `clock::timestamp_ms` with no grace window and epoch rollover can be exploited by timing transactions
- **FP:** Grace windows, monotonic checks, or delayed effectiveness prevent boundary manipulation
- **Search:** `clock::timestamp_ms` and check for strict `==` or tight boundary comparisons

### 6.2 Oracle Input Integrity Gaps

- **D:** Price or rate from an oracle object is consumed directly without zero-value rejection, staleness check, bounds, confidence validation, or a deviation guard
- **FP:** Zero or invalid readings are rejected, and staleness checks, bounds, confidence handling, and a circuit breaker such as maximum deviation per epoch are all present
- **Search:** Oracle object reads feeding into settlement, liquidation, or swap logic, especially price, confidence, exponent, or reciprocal-conversion paths

### 6.3 Timestamp or Oracle Diagnostics Gaps

- **D:** Time- or oracle-sensitive state transitions do not persist enough metadata to reconstruct which timestamp, epoch, round, or price version was used during settlement
- **FP:** Events or state fields record the effective clock or oracle inputs for later verification and incident response
- **Search:** settlement and pricing flows using `clock::timestamp_ms` or oracle reads, and whether the chosen inputs are emitted or stored

### 6.4 Stale Off-Chain Authorization

- **D:** Off-chain signed approvals, attestations, or enclave outputs remain valid indefinitely, with no expiry, timestamp bound, or freshness window tied to on-chain verification
- **FP:** Signed payloads include an expiry or freshness timestamp, and on-chain verification rejects stale signatures after a bounded validity window
- **Search:** signature verification paths, attestation payloads, timestamp fields in signed messages, and whether the contract compares them against `clock::timestamp_ms`

### 6.5 Multi-Feed Selection Integrity Gaps

- **D:** Oracle aggregation or feed-selection logic allows duplicate feed IDs, updates the chosen candidate before validating confidence or quality thresholds, or otherwise lets an invalid source crowd out the newest valid reading
- **FP:** Feed IDs are unique within each selection set, and candidate replacement occurs only after all required validity checks such as confidence, staleness, and format integrity pass
- **Search:** loops over oracle or feed IDs, uniqueness assumptions without explicit checks, and selection logic that compares timestamps before verifying confidence, deviation, or feed validity

### 6.6 Caller-Supplied Price or Anchor Not Bound to Canonical Source

- **D:** A price, `sqrt_price`, rate, or index used for accounting, share, valuation, or reward weight is accepted as a function parameter and only sanity-checked (within a tick range or numeric bounds), never read from or asserted equal to the canonical on-chain source it claims to represent, letting a stale or skewed but range-valid value bias accounting in the setter's favor
- **FP:** The accounting value is read directly from the canonical object (e.g., `get_pool_sqrt_price`), or the supplied value is asserted equal to (or within a tight, documented tolerance of) the live canonical reading before being stored or used
- **Search:** entrypoints taking `sqrt_price`/`price`/`rate` parameters later used in share, reward, collateral, or settlement math, and whether the value is bound to the live pool/oracle rather than only checked for range membership. Do not auto-dismiss this as "trusted admin input" when a canonical on-chain source is available in the same call
