# Transaction Composition and PTB Safety

## 7. Transaction Composition and PTB Safety

### 7.1 Multi-Step PTB State Bypass

- **D:** Multiple commands in the same PTB can be composed to reuse a ticket, bypass a phase check, consume and re-acquire authority, or otherwise circumvent a state machine that is only safe under single-step assumptions
- **FP:** The flow consumes one-time resources atomically, binds checks to the actual transition being executed, and prevents same-PTB reuse of nonce, ticket, or capability state
- **Search:** ticket, receipt, or nonce patterns; functions that read then set phase or spent flags; flows where command N creates authority that command N+1 can immediately reuse

```move
module demo::ptb_reuse {
    use sui::object::UID;

    public struct Ticket has key, store { id: UID, spent: bool }

    public fun borrow_value(ticket: &Ticket): u64 {
        assert!(!ticket.spent, 0);
        100
    }

    // Bug: a PTB can call borrow_value(ticket) first, then spend(ticket) later.
    // The read and the state transition are not bound together.
    public fun spend(ticket: &mut Ticket) {
        assert!(!ticket.spent, 1);
        ticket.spent = true;
    }

    // Safe shape: consume or mark the ticket in the same transition that uses it.
    public fun consume(ticket: &mut Ticket): u64 {
        assert!(!ticket.spent, 2);
        ticket.spent = true;
        100
    }
}
```

### 7.2 Emergency Function Overreach

- **D:** Pause, recovery, or admin emergency functions can arbitrarily withdraw user funds or bypass normal restrictions
- **FP:** Emergency paths are minimal, controlled by multisig, and emit events for every action
- **Search:** Functions named `emergency_*`, `pause_*`, or `rescue_*` and verify the scope of allowed actions

### 7.3 Incomplete State-Machine Exhaustion Checks

- **D:** Multi-step workflows validate the current phase on the main path but leave helper paths, cancellation flows, or cleanup functions callable in states where they should be inert
- **FP:** Every state-mutating helper checks the same phase or derives authorization from a consumed one-shot resource
- **Search:** `status`, `phase`, `state`, `paused`, `closed`, and compare checks across create, execute, cancel, settle, and cleanup flows
