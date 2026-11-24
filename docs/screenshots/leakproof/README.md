# Advanced evidence — Leakproof Briefs

One Testnet run of this repo's app, **2026-11-24**. Both channels `CHANNEL_READY` (500 CKB funded each, Bottle
side 150 CKB). Full record with invoice, fee and balances: [`docs/ADVANCED-RUN.md`](../../ADVANCED-RUN.md).

| File | Caption |
| --- | --- |
| `01-sealed-copy.png` | Seal desk: the brief, buyer handle `58e143c5`, the generated offer JSON (ciphertext + invoice, no key) and the issuance register. |
| `02-wrong-handle-refused.png` | Buyer A refusing a copy sealed for `00000000`: "This copy was sealed for 00000000, not for you (58e143c5)." Both nodes `CHANNEL_READY`, buyer 400/150 CKB, seller 401/149 CKB. |
| `03-offer-and-rejected.png` | The buyer's dossier: free preview, `SEALED` stamp, 1930 bytes of AES-256-GCM ciphertext, payment hash, and "Decryption rejected: this copy carries no key." |
| `04-payment-receipt.png` | Receipt: 1 CKB, routing fee 0.001 CKB, total 1.001 CKB, payment hash `0xfce77c3e…64c4e3`, buyer handle `58e143c5`. |
| `05-unlocked-brief.png` | The brief decrypted locally with the preimage Fiber returned for that invoice — 1914 characters, matching the seller's text byte-for-byte. |
| `06-copy-ledger.png` | The issuance register next to the settled receipt: one row per copy, handle plus payment hash. |

The register also holds rows from the two capture copies (the paid one and the deliberately mis-addressed one),
which is expected: the ledger records every invoice issued, paid or not.

No keys, preimages, seed phrases or browser storage appear in these images.
