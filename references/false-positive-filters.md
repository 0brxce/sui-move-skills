# False-Positive Filters

Use this reference during the false-positive pass. These filters generate challenges to test against the code. They are not standalone proof that a candidate is safe.

## Reachability

- Is the code path actually externally reachable?
- Is a supposed bug limited to `init`, tests, dead helpers, or internal maintenance flows?
- Are `friend` or `public(package)` functions being treated as attacker-reachable without a real bridge?

## Ownership and Linearity

- Does a by-value object parameter already prove legitimate custody?
- Does the attack assume the caller can fabricate an object, borrow, or object ID that Sui prevents?
- Does the path require simultaneous borrows or moves that Move linearity forbids?

## Capability Obtainability

- Is the privileged object only issued in initialization?
- Does the capability lack `store`, lack transfer paths, or remain under controlled custody?
- Is a supposed re-issuance or recovery path itself capability-gated?

## Shared Object Authorization

- Is the shared object globally reachable but still protected by a non-forgeable proof object, capability, or invariant-preserving wrapper?
- Is the candidate confusing shared reachability with unrestricted mutation?

## Abort and PTB Semantics

- Does the concerning state survive a successful transaction, or is it only an intermediate state before abort rollback?
- Does the proposed PTB composition fail because the one-time resource is consumed, marked spent, or otherwise unavailable?

## Trust Model and Upstream Checks

- Is the behavior simply an intended admin power or a trusted governance action?
- Is there an upstream precondition that already proves authorization before the helper is called?
- Is the finding relying on an undocumented off-chain assumption rather than code-backed reachability?

## Decision Rule

If any filter exposes a blocker that the code does not overcome, reject the candidate or move it to `Unknown`. Do not keep it as a validated finding.
