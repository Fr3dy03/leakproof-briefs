# Advanced run record — Leakproof Briefs

Filled from one real Testnet run on **2026-11-24**. Reviewers use it to cross-check the screenshots and the
recording. Only public values are here: node handles, channel state, invoice, payment hash, fee. **No keys,
preimages, seed phrases or browser storage.**

## Environment

| Field | Value |
| --- | --- |
| Date (UTC) | 2026-11-24 |
| Network | CKB Testnet / Fiber Testnet |
| Buyer A handle | `58e143c5` |
| Seller C channel state (A→Bottle, C→Bottle) | both `CHANNEL_READY` |
| Channel funding | 500 CKB each (Bottle side provisioned 150 CKB inbound on each) |
| Funding addresses | buyer `…q2303dn5dvhd009f26luge4dycsvz2ddwsq8glhe`, seller `…qgc3ld3wzns5ljcv2058sq4ruf4hr8w0sgg3x5cj` |
| App commit | `fbe2c11` plus the peer-handshake retry in `lib/fiber.ts` |

## Copy issued to Buyer A

| Field | Value |
| --- | --- |
| Brief title | Pay-to-unlock vs. the account paywall |
| Buyer handle on the offer (`buyer.handle`) | `58e143c5` |
| Sealed ciphertext size | 1930 bytes (screenshot 03) |
| Invoice (`fibt…`) | carried in the exported offer JSON; the object was cleared from the screen after the run, the payment hash below identifies it |
| Payment hash | `0xfce77c3ee7918800adac7af8c441f407c98a3a407cd0380e66531b8e3264c4e3` |
| Fee | 0.001 CKB |
| Total paid | 1.001 CKB |
| Decrypted text matched seller input | yes — byte-for-byte, 1914 characters |
| Ledger entry appears under the handle | yes (screenshot 06, row `58e143c5`) |

Channel balances after settlement: Buyer A `local 400 · Bottle 150`, Seller C `local 401 · Bottle 149` CKB —
the seller side gained exactly the 1 CKB that was paid.

## The attribution check (the point of this build)

| Field | Value |
| --- | --- |
| A copy was first sealed for a deliberately wrong handle | `00000000` |
| Buyer A's refusal message | "This copy was sealed for 00000000, not for you (58e143c5). Ask the seller for a copy issued to your handle." |
| Then a copy was sealed for Buyer A's real handle and paid | yes |

The refusal is enforced in the buyer's own app against `offer.buyer.handle`; nothing about the ciphertext or
the invoice differs, which is why the copy cannot simply be forwarded.

## Demo sequence

Captured from the run above, in `docs/screenshots/leakproof/`:

| File | What it shows |
| --- | --- |
| `01-sealed-copy.png` | Seal desk: brief, buyer handle `58e143c5`, offer JSON, issuance register |
| `02-wrong-handle-refused.png` | Buyer A refusing the copy sealed for `00000000`, both channels `CHANNEL_READY` |
| `03-offer-and-rejected.png` | Dossier: preview, `SEALED` stamp, 1930 bytes, payment hash, "Decryption rejected" |
| `04-payment-receipt.png` | Receipt: 1 CKB, fee 0.001, total 1.001, payment hash, buyer handle |
| `05-unlocked-brief.png` | The brief decrypted locally with the payment preimage |
| `06-copy-ledger.png` | Issuance register: handle + payment hash, next to the settled receipt |

## Note on the connect path

The first channel open failed with `Peer Pubkey(…) 's feature not found, waiting for peer to send Init
message`: `connectPeer` resolves when the transport is up, before Bottle has exchanged features. `lib/fiber.ts`
now retries the open for up to 45 seconds on exactly that error, which is safe because no channel is created
by the failed attempt. Both channels opened on the retry.

## Result

Typecheck, 35 tests and the production build pass. Live Testnet flow: **recorded above on 2026-11-24**, both
channels `CHANNEL_READY`, one 1 CKB payment settled (fee 0.001 CKB), brief decrypted and matched. Anything not
filled in above should be treated as not yet demonstrated.
