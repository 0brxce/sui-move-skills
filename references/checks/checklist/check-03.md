# Token, Treasury, and Accounting

## 3. Token, Treasury, and Accounting

### 3.1 Unauthorized Mint (`TreasuryCap` Misuse)

- **D:** `coin::mint` is reachable without holding `TreasuryCap`, or `TreasuryCap` is stored in a shared object accessible to all
- **FP:** Mint is capability-gated and `TreasuryCap` is held by a controlled address or locked in a governed object
- **Search:** `coin::mint`, `TreasuryCap` storage location

### 3.2 Unauthorized Burn / Withdraw

- **D:** Burn or withdraw path does not verify that the caller owns the resource being burned
- **FP:** Ownership is enforced via `object::id` comparison or the resource is passed by value, so Move linearity ensures caller custody
- **Search:** `coin::burn`, `balance::split`, `coin::take`; check caller authority

### 3.3 Dual-Ledger Drift (`Balance<T>` vs custom ledger)

- **D:** On-chain `Balance<T>` and an internal accounting field such as `total_deposited: u64` can diverge due to missed update paths
- **FP:** There is one source of truth, or derived values are computed from `balance::value()` on read rather than stored separately
- **Search:** Fields named `total_*`, `balance_*`, or `amount_*` as `u64` alongside real `Balance<T>` fields

```move
module demo::ledger_drift {
    use sui::balance::{Self, Balance};
    use sui::object::UID;

    public struct Vault<T> has key, store {
        id: UID,
        balance: Balance<T>,
        total_deposited: u64,
    }

    public fun deposit<T>(vault: &mut Vault<T>, coin_value: u64) {
        vault.total_deposited = vault.total_deposited + coin_value;
        // balance::join(&mut vault.balance, coin_into_balance(coin))
    }

    // Bug: withdraw changes real balance but forgets total_deposited.
    public fun admin_skim<T>(vault: &mut Vault<T>, amount: u64): Balance<T> {
        balance::split(&mut vault.balance, amount)
    }
}
```

### 3.4 Amount Boundary / Replay Gaps

- **D:** Missing checks for zero amounts, min or max bounds, identical in and out asset types in conversion flows, duplicate reward claims, or repeated voucher redemptions
- **FP:** Every entrypoint asserts non-zero input, enforces bounds, rejects no-op self-conversion paths where relevant, and uses a consumed or spent flag or ID-based replay protection
- **Search:** `assert!(amount > 0`, asset-type comparisons in swap or conversion flows, zero-value funding or deposit paths that still refresh timestamps or locks, and reward or claim functions missing ID deduplication

### 3.5 Manipulable Fee / Reward Math

- **D:** Rounding direction favors the user, reward update happens after balance change, or integer division loses dust that accumulates to an attacker
- **FP:** Fees round up in a protocol-favorable way, reward snapshots are taken before state change, and math order is documented
- **Search:** `/` operator in fee or reward calculations and verify rounding direction

### 3.6 Dust and Residual Accounting Drift

- **D:** Integer division, truncation, or remainder handling leaves persistent dust, stranded balances, or slowly growing accounting mismatch even when there is no immediate profit path
- **FP:** Remainders are tracked explicitly, swept deterministically, or the design intentionally accepts bounded dust with clear invariants
- **Search:** `/` and `%` in accounting logic, remainder variables, and state transitions that drop small residual values on deposit, withdraw, claim, or rebalance

### 3.7 Missing Accrual Snapshot on State Change

- **D:** Functions that activate, deactivate, settle, close, or otherwise change accounting state do not realize pending rewards, fees, or funding before flipping the state flag or moving balances
- **FP:** Every state transition that changes eligibility, pool activity, or balance participation snapshots or settles the pending accrual first
- **Search:** `activate`, `deactivate`, `pause`, `unpause`, `settle`, `close`, reward index updates, funding updates, and whether the accrual update happens before the state mutation

### 3.8 Gross-vs-Net Validation Mismatch

- **D:** Validation compares limits, capacity, collateral, or fee thresholds against a gross amount, but the actual state update uses a net amount after fees, burns, or deductions
- **FP:** The same effective amount is used consistently in validation and the subsequent state update, or the code documents why a gross-value check is intentional
- **Search:** deposit or mint flows that compute `fee_amount`, `net_amount`, or split balances after an earlier `assert!` against capacity, health, or quota limits

### 3.9 Wrong Variable in Settlement or Fee Split

- **D:** A withdrawal, liquidation, settlement, or fee split uses a similarly named but semantically different variable, causing the wrong balance component to be charged, released, or returned
- **FP:** Each split, fee deduction, and return path uses the matching accounting variable, and paired amount names are tested or asserted close to use
- **Search:** `split`, `take`, `join`, `fee`, `collateral`, `borrow`, `trading`, `funding`, `reward`, and compare the variable used in the transfer against the comment and intended invariant

### 3.10 Unsafe Config-Derived Divisor or Scale

- **D:** Math depends on a config vector slot, scaling factor, decimal field, or rate denominator that can be zero, mis-sized, or use the wrong precision base
- **FP:** Config initialization validates vector length, non-zero divisors, and scaling conventions, and downstream math uses the same documented base
- **Search:** `/` by config-derived fields, `pow`, decimal scaling, vector index constants such as `I_SCALE`, and initialization paths that accept raw config arrays

### 3.11 Zero-Effect Allocation Still Consumes Funds

- **D:** Reward, fee, or incentive allocation deducts from an available pool or advances state even when there are zero eligible shares, zero effective distribution, or a zero increment after truncation
- **FP:** Allocation aborts, pauses, or leaves balances untouched when there is no eligible recipient base or the computed increment is zero
- **Search:** `total_share == 0`, `price_index_increment == 0`, reward allocation branches, and code that subtracts from unallocated or reserve balances before confirming a non-zero effective distribution

### 3.12 Return Value or Checkpoint Mismatch

- **D:** A helper computes one bounded index, amount, or checkpoint for the active path but returns or persists a different later value, causing future claims, harvests, or validations to fail or skip entitlement
- **FP:** The returned and stored checkpoint exactly matches the branch-specific value actually used for the current state transition
- **Search:** helpers returning tuples like `(amount, index)`, reward or funding checkpoint updates, and branches for locked or capped positions where one value is used for math but another is returned or stored

### 3.13 Signed Arithmetic or Negative-to-Unsigned Confusion

- **D:** Fixed-point or signed-value helpers convert potentially negative values into `u64`, compare raw sign-bit representations as if they were magnitude overflow checks, or otherwise conflate sign encoding with numeric bounds
- **FP:** Signed arithmetic validates sign and magnitude separately, rejects negative values before unsigned conversion, and uses overflow checks that match the actual numeric encoding
- **Search:** `u64` conversions of fixed or signed types, sign-magnitude helpers, raw bit comparisons against sign masks, and clipping logic that uses unsigned mins or caps after signed math

### 3.14 Invariant Not Maintained Across Alternate Funding Paths

- **D:** A lock, cooldown, reward, or solvency invariant is maintained on the obvious deposit or funding path but not on another reachable path that changes the same balance or entitlement state
- **FP:** Every path that increases or decreases the relevant balance, reward base, or locked value updates the same associated timestamps, checkpoints, and guard state consistently
- **Search:** all writes to `balance`, `value`, `amount`, `last_*`, lock timestamps, cooldown markers, and reward checkpoints; compare the main funding path against settlement, request, refund, admin, and helper-driven balance changes
