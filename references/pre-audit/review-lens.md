# Review Lens

Use this reference before deep review and during false-positive validation.

## Sui Review Lens

- Objects are the core unit of state. Track who can own, borrow, share, freeze, wrap, unwrap, or transfer each important object.
- Capabilities are authority. Most real privilege in Sui comes from possession of a cap, witness, or privileged object, not from the caller address alone.
- `public` and `entry` functions define attacker reachability. `public(package)` and `friend` reduce reachability but still matter for trust boundaries.
- Shared objects are globally reachable. Any safety property around them must come from explicit checks and invariant-preserving logic.
- Dynamic fields, tables, bags, and derived storage extend state beyond the parent object.
- `TxContext::sender()` proves the immediate sender, not broader intent. Do not treat it as a substitute for a capability unless the design explicitly trusts that model.
- Package upgrades and migrations are part of the attack surface.

## Anti-False-Positive Rules

- A checklist hit, naming pattern, or code sketch match is only a candidate signal, never proof.
- Do not infer exploitability from names like `AdminCap`, `Vault`, `Treasury`, `withdraw`, or `claim` alone; verify the actual type abilities, call reachability, and object flow.
- Treat a path as safe until you can prove attacker reachability, obtainable authority or object inputs, and a concrete broken invariant after execution.
- If a concern depends on an unstated off-chain process, governance behavior, or deployment assumption, keep it in assumptions or open questions unless the code itself makes the risk reachable.
