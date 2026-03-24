# Data Structures and Storage Semantics

## 4. Data Structures and Storage Semantics

### 4.1 Dynamic Field Key Collision / Confusion

- **D:** Raw bytes or string literals are used as dynamic field keys, or two modules use the same key string on the same parent object
- **FP:** Keys are typed structs unique to each module or domain; no raw byte keys in shared parent objects
- **Search:** `dynamic_field::add.*b"`, `dynamic_object_field::add.*b"`

### 4.2 Dynamic Field Cleanup Gaps

- **D:** A parent object is deleted or closed but dynamic child fields are not removed first, causing leaked storage
- **FP:** A teardown function iterates and removes all child fields before deleting the parent, or a known cleanup step is documented
- **Search:** `object::delete` and check for preceding `dynamic_field::remove` calls

### 4.3 Stale Registry or Index Entries

- **D:** Secondary registries, lookup tables, or ownership indices are updated on create but not on transfer, delete, or close, leaving stale entries that misroute later logic or operator actions
- **FP:** Every lifecycle transition updates or clears the secondary index, or stale entries are harmless and never used for authorization or settlement
- **Search:** registry or index writes such as `table::add`, `dynamic_field::add`, `vec_map::insert`, then compare create/update/delete paths for matching cleanup

### 4.4 Derived Object Lineage Not Bound

- **D:** A child, enclave, versioned instance, or derived object can later be upgraded, destroyed, or authorized using an unrelated parent or config object because the original creator or config ID was never stored and re-checked
- **FP:** Derived objects persist the parent or config ID that created them, and all later maintenance or destruction paths verify the same lineage before acting
- **Search:** create or register flows that derive one object from another, then upgrade, rotate, or destroy helpers that compare only version numbers or loose type matches instead of the original parent or config ID
