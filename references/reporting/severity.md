# Severity

Use this reference when assigning `Risk` to validated findings.

## Risk

- `Critical`: direct theft, unlimited minting, permanent privilege takeover, or protocol-wide catastrophic loss
- `High`: serious unauthorized asset movement, irreversible freezing, or admin compromise with strong practical impact
- `Medium`: meaningful but scoped loss, denial of service, or invariant break with constraints
- `Low`: limited impact, hard-to-trigger edge case, or defense-in-depth weakness
- `Informational`: security-relevant clarity, observability, diagnostics, or maintainability weakness with little or no direct exploit impact

If a finding depends on unverified deployment, governance, or off-chain behavior, prefer `Medium` or move it out of validated findings entirely.
Validate and report well-supported `Medium`, `Low`, and `Informational` findings by default when they are grounded in code and materially help the reader understand risk, hardening gaps, or incident-response blind spots.
