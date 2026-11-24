# Advanced run record — Leakproof Briefs

Fill this in from one real Testnet run, then commit. Reviewers use it to cross-check the screenshots and the
recording. Only public values belong here: node handles, channel state, invoice, payment hash, fee. **Never
keys, preimages, seed phrases or browser storage.**

## Environment

| Field | Value |
| --- | --- |
| Date (UTC) | |
| Network | CKB Testnet / Fiber Testnet |
| Buyer A handle | (8 hex, shown in the buyer card) |
| Seller C channel state (A→Bottle, C→Bottle) | both `CHANNEL_READY` |
| Channel funding | 500 CKB each |
| App commit | |

## Copy issued to Buyer A

| Field | Value |
| --- | --- |
| Brief title | |
| Buyer handle on the offer (`buyer.handle`) | |
| Sealed ciphertext size (bytes, shown in the buyer card) | |
| Invoice (`fibt…`, truncated is fine) | |
| Payment hash | |
| Fee (CKB) | |
| Total paid (CKB) | |
| Decrypted text matched seller input | yes / no |
| Ledger entry appears under the handle | yes / no |

## The attribution check (the point of this build)

| Field | Value |
| --- | --- |
| A copy was first sealed for a deliberately wrong handle | e.g. `00000000` |
| Buyer A's refusal message | "This copy was sealed for 00000000, not for you (…)" |
| Then a copy was sealed for Buyer A's real handle and paid | yes / no |

If a second buyer node is available, issue a second copy and record both payment hashes — two copies, two
keys, two settlements, one brief.

## Demo sequence to capture

Save into `docs/screenshots/leakproof/` (or record one continuous take covering the same beats):

| File | Must be visible |
| --- | --- |
| `01-sealed-copy.png` | Seller panel: brief + buyer handle + "Seal a copy & create 1 CKB invoice" result, offer JSON present |
| `02-wrong-handle-refused.png` | Buyer A refusing a copy addressed to another handle (attribution property) |
| `03-offer-and-rejected.png` | Buyer side: listing, "Sealed for" badge, free preview, sealed body, and "Decryption rejected" |
| `04-payment-receipt.png` | Receipt: 1 CKB, fee, total, payment hash, buyer handle |
| `05-unlocked-brief.png` | Decrypted full brief matching the seller's text |
| `06-copy-ledger.png` | Seller copy ledger listing the handle and payment hash |

## Result

Typecheck, 35 tests and the production build pass on this commit. Live Testnet flow: **recorded above on
<date>**, both channels `CHANNEL_READY`, one 1 CKB payment settled and decrypted. Anything not filled in
above should be treated as not yet demonstrated.
