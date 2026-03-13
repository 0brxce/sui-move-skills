# Scoping

Use this reference during initial package inventory and trust-boundary mapping.

## Build the Inventory

Record at least:

- `Move.toml`, named addresses, and package dependencies
- all modules and their trust boundaries
- all `entry`, `public`, `public(package)`, `friend`, and `init` functions
- all structs with `key`, important `store` types, and capability or witness types
- tests or helper modules that reveal intended invariants or privileged flows

## Scope Filters

Default to production-relevant code. Treat these as lower priority or out of scope unless they interact with real authority or state transitions:

- test-only modules
- mock, demo, or example code
- migration helpers or scripts that are clearly one-off and not attacker reachable
- internal scaffolding that never touches production capabilities, shared objects, or user assets

Bring them back into scope if they:

- create, hold, transfer, wrap, unwrap, or recover privileged objects
- mutate the same shared objects or accounting state as production flows
- define migration or upgrade logic that can affect live state
- reveal intended trust assumptions or invariants needed to judge production code

## Scope Output

At the end of scoping, keep compact working notes for:

- in-scope modules
- out-of-scope modules and why
- privileged objects and capabilities
- user asset objects
- main trust boundaries
