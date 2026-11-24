# Screenshot evidence

Images must live in this repository: CKBoost does not accept screenshot uploads, only links. Commit the PNGs
and use the GitHub folder URL in the quest field.

```
docs/screenshots/
  basic/            four shots from the hosted fiber.world tutorial (Basic quest)
    01-channels-ready.png
    02-offer-and-rejected.png
    03-payment-receipt.png
    04-decrypted-result.png
  leakproof/        four to six shots from this app's Testnet run (Advanced quest)
    01-sealed-copy.png
    02-wrong-handle-refused.png
    03-offer-and-rejected.png
    04-payment-receipt.png
    05-unlocked-brief.png
    06-copy-ledger.png
```

Requirements for every image:

- Legible at 100% zoom: payment hash, amount, and channel state must be readable, not a thumbnail of a full
  desktop.
- One requirement per image. Crop to the relevant panel instead of shrinking the whole page.
- Shows the real Testnet run, with timestamps or a run date in the caption.

Never include: private keys, seed phrases, recovery phrases, passwords, exported credentials, or browser
storage contents. Browser storage in the tutorial holds node keys — keep devtools out of every shot.

If you record a video instead of the Advanced sequence, keep the same order: sealed copy → wrong-handle
refusal → rejected decryption → settled receipt → unlocked brief → ledger. Link the recording in
`docs/ADVANCED-RUN.md` and in the CKBoost field.
