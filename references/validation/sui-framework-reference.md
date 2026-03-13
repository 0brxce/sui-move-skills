# Sui Framework Reference

Use this reference when candidate validation depends on Sui framework or Move standard library semantics rather than only on target-project code.

Treat the official `MystenLabs/sui` repository as the semantic source of truth for:

- object ownership and transfer behavior
- capability and witness patterns implemented in framework modules
- `coin`, `balance`, and supply-related behavior
- `dynamic_field`, `dynamic_object_field`, `table`, `bag`, and derived-storage behavior
- `tx_context`, `clock`, `event`, `package`, and other framework-defined runtime semantics
- visibility and package-boundary assumptions that rely on framework modules
- abort behavior or invariants enforced by framework helpers

## Canonical Upstream Paths

When cross-checking framework behavior, start from these upstream locations in `MystenLabs/sui`:

- `crates/sui-framework/packages/sui-framework/sources`
- `crates/sui-framework/packages/move-stdlib/sources`

Prioritize the exact framework module imported by the target code. Examples:

- `sui::coin` -> `.../sui-framework/sources/coin.move`
- `sui::balance` -> `.../sui-framework/sources/balance.move`
- `sui::transfer` -> `.../sui-framework/sources/transfer.move`
- `sui::dynamic_field` -> `.../sui-framework/sources/dynamic_field.move`
- `sui::table` -> `.../sui-framework/sources/table.move`
- `std::option` -> `.../move-stdlib/sources/option.move`

## Validation Rule

If a finding or rejection depends on framework semantics, do not rely only on naming, intuition, or wrapper usage inside the target repository.

Instead:

1. Identify the exact framework modules used by the target code.
2. Cross-check the relevant upstream module implementation or public API surface.
3. Base the validation note on the target code plus the referenced framework behavior.

## Fallback Order

Use this order when resolving framework semantics:

1. Local copies referenced by the target package, if the dependency source is present in the repository.
2. Vendored or pinned dependency sources that clearly correspond to the target package revision.
3. The canonical upstream layout in `MystenLabs/sui` when local dependency code is absent or incomplete.

If the target package depends on a version-specific Sui behavior and the exact dependency revision cannot be established, prefer `Unknown` over overconfident validation.
