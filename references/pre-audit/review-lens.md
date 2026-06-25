# Review Lens

Use this reference before deep review and during false-positive validation.

## Sui Review Lens

- Objects are the core unit of state. Track who can own, borrow, share, freeze, wrap, unwrap, or transfer each important object.
- Capabilities are authority. Most real privilege in Sui comes from possession of a cap, witness, or privileged object, not from the caller address alone.
- `public` and `entry` functions define attacker reachability. `public(package)` and `friend` reduce reachability but still matter for trust boundaries.
- Shared objects are globally reachable. Any safety property around them must come from explicit checks and invariant-preserving logic.
- Dynamic fields, tables, bags, and derived storage extend state beyond the parent object.
- Review invariants across all mutation paths, not one function at a time. If one field such as `balance`, `last_funded_timestamp`, `reward_index`, or `status` is security-relevant, trace every reachable path that can change it.
- When prior audits or patch commits exist, treat them as attack-surface hints, not closure proof. A new guard on one path does not prove equivalent paths are fixed.
- Treat fairness, timelock, lifecycle, observability, and liveness properties as security-relevant invariants when the code gives one actor the ability to change terms, weaken monitoring truth, or degrade future safe operation for others.
- `TxContext::sender()` proves the immediate sender, not broader intent. Do not treat it as a substitute for a capability unless the design explicitly trusts that model.
- Package upgrades and migrations are part of the attack surface.
- Do not treat signature or attestation modules as mere adapters. Review registration, rotation, destruction, replacement, and stale-object handling as a full lifecycle state machine.
- When target code relies on `sui::` or `std::` modules, reason conservatively from the observable target-project behavior instead of overcommitting to unverified dependency assumptions.

## Anti-False-Positive Rules

- A checklist hit, naming pattern, or code sketch match is only a candidate signal, never proof.
- Do not infer exploitability from names like `AdminCap`, `Vault`, `Treasury`, `withdraw`, or `claim` alone; verify the actual type abilities, call reachability, and object flow.
- Treat a path as safe until you can prove attacker reachability, obtainable authority or object inputs, and a concrete broken invariant after execution.
- If a concern depends on an unstated off-chain process, governance behavior, or deployment assumption, keep it in assumptions or open questions unless the code itself makes the risk reachable. If the code itself exposes a weakened trust boundary, broad acceptance rule, or unsafe lifecycle assumption, keep it as a lower-severity validated issue rather than filtering it out automatically.
- If a concern turns on framework behavior such as transfer semantics, dynamic-field ownership, coin supply handling, or abort effects, keep the conclusion conservative unless the target code itself makes the behavior clear.
- Do not require every validated issue to look like immediate theft. A reachable code-backed fairness break, lifecycle authorization drift, invariant mismatch across equivalent paths, or cumulative liveness degradation is still a real security outcome.
- Do not mark an issue family as fixed just because some nearby functions now check `pool_object_id`, config IDs, share types, or similar guard fields. Re-run the full call chain and equivalent paths before closing the family.

## Detection Tactics

Apply these on every review; they catch bug classes that single-function reading misses.

- Diff sibling functions that perform the same class of operation. An argument, guard, assertion, or event that is present in one and absent in the other is a strong bug signal. Examples: `add_liquidity` (asserts `delta_liquidity > 0`) vs `add_liquidity_fix_coin` (no such check); `collect_fee` (passes `0xFFFFFFFFFFFFFFFF` as the max) vs `collect_clmm_reward` (passes a caller coin's `value` as the max).
- When a dependency is absent or unreadable, reason from the visible call site rather than filing a caveat. For each argument, ask "is this the value the callee expects?"; for each external `burn`/`destroy`/`close`/`swap`, state the conventional callee post-condition and verify the caller satisfies it. The two most damaging misses are usually wrong-argument and unmet-callee-precondition bugs that are fully provable from the caller.
- For any truncating integer division, compute the realistic magnitude before labeling it "dust." Use an 18-decimal token and a large supply or share. Truncation that floors a reward/interest increment to zero and blocks all payouts is High severity, not informational.
- Do not over-apply the trusted-admin filter to caller- or admin-supplied economic inputs (price, anchor, rate, share weight). When a canonical on-chain source for that value exists in the same call, a missing binding to it is a validated lower-severity finding even under a trusted-admin model.
- Walk the pause/emergency state machine from the recovery side, not just the lockdown side: enumerate which admin and recovery functions the pause itself disables. A rescue path gated by the same check the pause trips is a real defect.
- Enumerate exhaustively rather than stopping at the first instance. After finding one missing event, one missing non-zero check, or one event/state mismatch, list every peer function and confirm each — the cheap checks travel in packs.
