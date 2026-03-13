# Severity and Confidence

Use this reference when assigning `Risk` and `Confidence` to validated findings.

## Risk

- `Critical`: direct theft, unlimited minting, permanent privilege takeover, or protocol-wide catastrophic loss
- `High`: serious unauthorized asset movement, irreversible freezing, or admin compromise with strong practical impact
- `Medium`: meaningful but scoped loss, denial of service, or invariant break with constraints
- `Low`: limited impact, hard-to-trigger edge case, or defense-in-depth weakness
- `Informational`: clarity or maintainability only; usually omit unless the user asked for broad review notes

## Confidence

- `High`: the code directly proves attacker reachability, input obtainability, and the broken post-transaction state
- `Medium`: the exploit path is well supported but still depends on one bounded assumption
- `Low`: the issue is plausible but the code leaves material uncertainty

If a finding depends on unverified deployment, governance, or off-chain behavior, prefer `Medium` or move it out of validated findings entirely.
