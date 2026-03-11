# Token, Treasury, and Accounting

## 3. Token, Treasury, and Accounting

### 3.1 Unauthorized Mint (`TreasuryCap` Misuse)

- **Severity:** critical
- **D:** `coin::mint` is reachable without holding `TreasuryCap`, or `TreasuryCap` is stored in a shared object accessible to all
- **FP:** Mint is capability-gated and `TreasuryCap` is held by a controlled address or locked in a governed object
- **Search:** `coin::mint`, `TreasuryCap` storage location

### 3.2 Unauthorized Burn / Withdraw

- **Severity:** critical
- **D:** Burn or withdraw path does not verify that the caller owns the resource being burned
- **FP:** Ownership is enforced via `object::id` comparison or the resource is passed by value, so Move linearity ensures caller custody
- **Search:** `coin::burn`, `balance::split`, `coin::take`; check caller authority

### 3.3 Dual-Ledger Drift (`Balance<T>` vs custom ledger)

- **Severity:** high
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

- **Severity:** medium – high
- **D:** Missing checks for zero amounts, min or max bounds, duplicate reward claims, or repeated voucher redemptions
- **FP:** Every entrypoint asserts non-zero input, enforces bounds, and uses a consumed or spent flag or ID-based replay protection
- **Search:** `assert!(amount > 0`, reward or claim functions missing ID deduplication

### 3.5 Manipulable Fee / Reward Math

- **Severity:** medium
- **D:** Rounding direction favors the user, reward update happens after balance change, or integer division loses dust that accumulates to an attacker
- **FP:** Fees round up in a protocol-favorable way, reward snapshots are taken before state change, and math order is documented
- **Search:** `/` operator in fee or reward calculations and verify rounding direction
