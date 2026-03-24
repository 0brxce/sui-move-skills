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
