# Basic quest — hosted tutorial walkthrough

Basic is completed on the **hosted tutorial**, not in this repo:
https://www.fiber.world/docs/build/encrypted-data-payment

The tutorial UI is what the graders expect to see, including the buttons "Decrypt without key" and
"Decrypt result". The local app in this repo is the **Advanced** deliverable.

## Steps and what should be on screen

1. **Reload once if prompted** to enable Fiber WASM. Do not skip it; the nodes will not start without it.
2. **Start Buyer Node A** and **Start Seller Node C**. Each shows its own funding address. They are different
   addresses; fund each separately from https://faucet.nervos.org. Anything over 500 Testnet CKB per node is
   enough for the channel plus the on-chain fee.
3. **Connect & open 499 CKB** on both nodes, to Bottle B. Follow the progress steps to
   `1 Connect peer → 2 Submit funding → 3 Confirm on-chain → 4 Channel ready`. Confirmation can take minutes;
   refresh rather than opening a replacement channel.
4. Keep the default report text (or type your own) in **Seller Node C**, then *Encrypt & create 1 CKB
   Invoice*. Copy the encrypted offer.
5. In **Buyer Node A**, paste the offer and *Validate encrypted offer*. Then **Decrypt without key** — this
   must be refused by AES-GCM authentication.
6. *Pay 1 CKB*. Wait for `Success`; the receipt shows the amount, the routing fee and the payment hash.
7. **Decrypt result** and compare it with the seller's original text.

## Status

Completed **2026-11-24** on the hosted tutorial: both channels `CHANNEL_READY`, one 1 CKB payment settled
(fee 0.001 CKB, total 1.001, payment hash `0x1e431860…270756`), result decrypted and matching. The four shots
are committed with captions in `docs/screenshots/basic/`.

## The four required screenshots

Save into `docs/screenshots/basic/`, commit, and link the folder in CKBoost.

| File | Must be visible |
| --- | --- |
| `01-channels-ready.png` | Both nodes' cards, buyer channel and seller channel, each showing `CHANNEL_READY` with balances |
| `02-offer-and-rejected.png` | Buyer side holding the encrypted offer, plus the "Decryption rejected" message |
| `03-payment-receipt.png` | Completed payment: **1 CKB** amount, fee, total, and the payment hash |
| `04-decrypted-result.png` | The buyer's decrypted result, matching the seller's original sample text |

Two screens are combined in `02` only if both are legible; otherwise split into `02a-offer.png` and
`02b-rejected.png`. One clear image per requirement beats a crowded composite.

## Caption template (put in the commit or a `basic/README.md`)

```
01 — Channel A→B and C→B both CHANNEL_READY, 20 Nov 2026, Testnet.
02 — Buyer A holds the encrypted offer; "Decrypt without key" was rejected.
03 — 1 CKB settled; fee 0.001 CKB; payment hash 0x….
04 — Buyer A's decrypted text matches the seller's original.
```

## Safety

Never screenshot or submit seed phrases, private keys, exported credentials or browser-storage contents. The
tutorial generates node keys in browser storage — keep that panel out of every shot.
