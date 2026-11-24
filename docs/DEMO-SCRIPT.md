# Demo recording — Leakproof Briefs

One continuous take of **90 seconds** covers the six evidence shots. Record it, then cut the stills from the
same file so the screenshots and the video cannot disagree.

## Pre-flight (do this before you press record)

| Check | Why |
| --- | --- |
| Buyer A and Seller C both show `CHANNEL_READY` | An opening channel fails the payment mid-take and costs you the run. |
| Buyer A's handle copied to the clipboard | No hunting for it on camera; it is the first 8 hex of the node id. |
| Brief text written and pasted into the seller panel | Retyping on camera wastes 20 seconds and invites typos. |
| Window at 1280×900, browser zoom 100% | Payment hash and fee need to stay legible in the stills. |
| Devtools **closed** | Browser storage holds node keys. Never on camera, never in a shot. |
| Telegram/CKBoost tab closed | Private notifications have no place in a public video. |
| Screen recorder rolling on the whole browser window | Captures the URL bar, which proves `localhost` and the Testnet run. |

Two nodes in two windows: Buyer A in one browser profile, Seller C in another (or a second browser).
Fiber keys live in browser storage, so the two identities must not share a profile.

## The take

| Time | On screen | Say |
| --- | --- | --- |
| 0:00–0:10 | Both nodes, both channels `CHANNEL_READY` | "Two browser nodes on CKB Testnet, each with a 500 CKB channel to Bottle." |
| 0:10–0:22 | Seller panel: brief, preview, Buyer A's handle → **Seal a copy & create 1 CKB invoice** | "The seller writes one brief and seals a copy **for a specific buyer handle**. A fresh AES key per copy — the key becomes that copy's invoice preimage." |
| 0:22–0:32 | The wrong-handle copy, Buyer A pasting it | "First, the trick that matters: a copy sealed for someone else." |
| 0:32–0:40 | Buyer A: refusal message | "Refused. The copy is bound to the handle it was sealed for, not to whoever holds the offer JSON." |
| 0:40–0:50 | Correct copy validated: free preview + "Sealed for" badge + sealed body | "The real copy: public preview is free, the body is ciphertext. The offer carries no key." |
| 0:50–0:58 | **Try to read it without paying** → rejection | "Reading without paying fails authentication, because the key only exists as a payment preimage." |
| 0:58–1:10 | **Pay 1 CKB** → receipt: amount, fee, total, payment hash | "One CKB over A → Bottle → C. The receipt records the fee and the payment hash." |
| 1:10–1:20 | **Unlock full brief** → decrypted text matching the seller's input | "Fiber returns the preimage, the browser uses it as the AES key, and the brief opens locally — nothing is sent anywhere to decrypt." |
| 1:20–1:30 | Seller copy ledger: handle + payment hash | "The seller keeps a public register of issued copies. That key now resolves to exactly one settlement, one buyer handle." |

Close on the register, not on a menu. It is the argument of the whole demo.

## The six stills

Cut from the recording, crop to the panel, keep the payment hash and fee readable.

| File → `docs/screenshots/leakproof/` | Frame |
| --- | --- |
| `01-sealed-copy.png` | 0:22 — offer created for Buyer A's handle, offer JSON visible |
| `02-wrong-handle-refused.png` | 0:32 — Buyer A refusing the copy addressed to another handle |
| `03-offer-and-rejected.png` | 0:50 — listing, "Sealed for" badge, free preview, sealed body, rejection |
| `04-payment-receipt.png` | 1:05 — receipt: 1 CKB, fee, total, payment hash, handle |
| `05-unlocked-brief.png` | 1:18 — decrypted brief matching the seller's text |
| `06-copy-ledger.png` | 1:28 — ledger row with handle and payment hash |

Six is the plan; five is acceptable if the wrong-handle refusal and the receipt are both in — those are the
two that carry the claim. Do not ship a demo that only shows money moving.

## Then

Fill `docs/ADVANCED-RUN.md` from the same run (invoice, payment hash, fee, decrypted-match check), commit the
PNGs plus the record, push, and open the folder URL on GitHub to confirm the images render before pasting the
link into CKBoost. If the recording is hosted off-GitHub, put its URL in `docs/ADVANCED-RUN.md` too so the
demo field has both.

## If something breaks on camera

- Payment stuck: **Check payment status**, never pay again. Say what you are doing; a pending payment that is
  checked and resolved reads as care, not failure.
- Channel not ready: stop, re-faucet, restart the take. Do not record a `CHANNEL_OPENING` state.
- Wrong handle by accident: that is shot 02. Use it, then seal the real copy.
