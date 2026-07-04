# Security Specification - HQ Payments

## Data Invariants
1. **User Integrity**: A user profile must have a valid PIN, email, and subscription status. Only admins can enable/disable other users.
2. **Ownership**: All business documents (Beneficiaries, Invoices, Checks) must contain a `userId` field matching the creator's UID.
3. **Relation Integrity**: A `Check` must belong to a valid `Invoice`.
4. **Temporal Integrity**: `createdAt` must be `request.time` and immutable. `updatedAt` must be updated to `request.time` on every write.
5. **Terminal State**: Once a `Check` is `PAID`, it cannot be reverted to `PENDING` by a non-admin.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create an invoice with someone else's `userId`.
2. **State Shortcutting**: Create a check directly with `status: 'PAID'` bypassing the logic.
3. **Shadow Update**: Update an invoice adding an `isAdmin: true` field.
4. **Orphaned Record**: Create a check with a non-existent `invoiceId`.
5. **PII Leak**: A user attempts to `get` the profile of another user.
6. **Query Scraping**: Attempting a `list` query on `invoices` without a `where` clause filtering by `userId`.
7. **Resource Poisoning**: Creating a beneficiary with a 1MB string as the name.
8. **Immortality Breach**: Attempting to change `createdAt` on an existing invoice.
9. **Role Escalation**: A regular user attempts to update their `role` to `ADMIN`.
10. **ID Injection**: Creating a document with a malicious ID containing script tags.
11. **Terminal Reversal**: Reverting a `PAID` check back to `PENDING`.
12. **Status Bypass**: Updating the `finalTotal` of an invoice without being the owner.

## The Test Runner (firestore.rules.test.ts)

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, collection } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-hq-payments",
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("Dirty Dozen #1: Identity Spoofing should fail", async () => {
  const alice = testEnv.authenticatedContext("alice");
  await assertFails(setDoc(doc(alice.firestore(), "invoices/inv1"), {
    userId: "bob",
    beneficiaryName: "Target",
    concept: "Theft",
    totalValue: 100,
    finalTotal: 100,
    months: 1,
    firstPaymentDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }));
});

// ... more tests for all 12 cases
```
