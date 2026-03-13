# Data Structures and Storage Semantics

## 4. Data Structures and Storage Semantics

### 4.1 Dynamic Field Key Collision / Confusion

- **Severity:** high
- **D:** Raw bytes or string literals are used as dynamic field keys, or two modules use the same key string on the same parent object
- **FP:** Keys are typed structs unique to each module or domain; no raw byte keys in shared parent objects
- **Search:** `dynamic_field::add.*b"`, `dynamic_object_field::add.*b"`

```move
module demo::df_key_confusion {
    use sui::dynamic_field;
    use sui::object::UID;

    public struct Registry has key, store { id: UID }
    public struct AdminConfig has store { fee_bps: u64 }
    public struct UserReceipt has store { amount: u64 }
    public struct ConfigKey has copy, drop, store {}

    public fun add_admin_config(registry: &mut Registry) {
        // Bug-prone: another module can also reuse b"config" on the same parent.
        dynamic_field::add(&mut registry.id, b"config", AdminConfig { fee_bps: 30 });
    }

    public fun add_admin_config_safe(registry: &mut Registry) {
        dynamic_field::add(&mut registry.id, ConfigKey {}, AdminConfig { fee_bps: 30 });
    }
}
```

### 4.2 Dynamic Field Cleanup Gaps

- **Severity:** medium
- **D:** A parent object is deleted or closed but dynamic child fields are not removed first, causing leaked storage
- **FP:** A teardown function iterates and removes all child fields before deleting the parent, or a known cleanup step is documented
- **Search:** `object::delete` and check for preceding `dynamic_field::remove` calls
