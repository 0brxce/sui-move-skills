# Sui Framework Reference

Use this reference when candidate validation depends on Sui framework or Move standard library semantics rather than only on target-project code.

Treat the local dependency sources resolved for the target package as the primary semantic source of truth. In practice, prefer `sui move build` output under `build/<package-name>/sources/dependencies`, then other local or vendored pinned sources, and only fall back to `MystenLabs/sui` when the exact local dependency source is unavailable.

Cross-check these semantics from the locally resolved framework and stdlib sources:

- object ownership and transfer behavior
- capability and witness patterns implemented in framework modules
- `coin`, `balance`, and supply-related behavior
- `dynamic_field`, `dynamic_object_field`, `table`, `bag`, and derived-storage behavior
- `tx_context`, `clock`, `event`, `package`, and other framework-defined runtime semantics
- visibility and package-boundary assumptions that rely on framework modules
- abort behavior or invariants enforced by framework helpers

## Generated Local Dependency Paths

Always prefer the build output that Sui materializes for the concrete package revision before consulting upstream. The audit workflow should run `sui move build` once so these paths exist when the package is buildable.

In local build output, common dependency directories are:

- `build/<package-name>/sources/dependencies/Sui/<module>.move`
- `build/<package-name>/sources/dependencies/MoveStdlib/<module>.move`

Use these mappings when jumping from imports to generated dependency files:

- `sui::<module>` -> `.../sources/dependencies/Sui/<module>.move`
- `std::<module>` -> `.../sources/dependencies/MoveStdlib/<module>.move`

Examples:

- `std::address` -> `build/<package-name>/sources/dependencies/MoveStdlib/address.move`
- `std::option` -> `build/<package-name>/sources/dependencies/MoveStdlib/option.move`
- `sui::coin` -> `build/<package-name>/sources/dependencies/Sui/coin.move`
- `sui::accumulator_metadata` -> `build/<package-name>/sources/dependencies/Sui/accumulator_metadata.move`

## Validation Rule

If a finding or rejection depends on framework semantics, do not rely only on naming, intuition, or wrapper usage inside the target repository.

Instead:

1. Identify the exact framework modules used by the target code.
2. Cross-check the relevant dependency module implementation or public API surface from the best available local, vendored, or upstream source.
3. Base the validation note on the target code plus the referenced framework behavior.

## Fallback Order

Use this order when resolving framework semantics:

1. Generated build output under `build/<package-name>/sources/dependencies`, if `sui move build` completed successfully.
2. Local copies referenced by the target package, if the dependency source is present in the repository.
3. Vendored or pinned dependency sources that clearly correspond to the target package revision.
4. The canonical upstream layout in `MystenLabs/sui` when local dependency code is absent or incomplete.

If the target package depends on a version-specific Sui behavior and the exact dependency revision cannot be established, prefer `Unknown` over overconfident validation.
