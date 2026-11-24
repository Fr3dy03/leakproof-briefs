# Submission map — Build on CKB Campaign #8

Campaign: **Unlock Encrypted Data with a Fiber Payment** · created by CKB DevRel · active **11/18/2026 – 11/25/2026**.
Quests: Basic (100 pts, 30 min, difficulty 1), Advanced (200 pts, 120 min, difficulty 2).
Prizes: 5–6 winners total — Basic $30, Advanced $50, Best Demo $25 (Advanced + Best = $75).
Advanced is only prize-eligible when **Basic is also completed**; Build on CKB Telegram membership is required.

## How CKBoost collects a submission

Each subtask is a field in the quest. The proof fields say, verbatim: *"Do not upload screenshots here:
upload on GitHub or a filesharing platform and share the link."* So every piece of evidence must resolve at
a public URL. This repo is that URL.

| Quest | Subtask | CKBoost field type | Evidence to submit |
| --- | --- | --- | --- |
| Basic | 1. Share your telegram handle | social | `@your_handle` (must be in the Build on CKB group) |
| Basic | 2. Share proofs of tutorial completion | content | Link to `docs/screenshots/basic/` in this repo (4 images, see `docs/BASIC-WALKTHROUGH.md`) |
| Basic | 3. Share your personal reflection | content | Pasted text, 300–450 words, own words (`docs/REFLECTION.md`) |
| Advanced | 1. Share your Github repo | technical | This repository URL |
| Advanced | 2. Share proofs of your working demo | technical | Link to `docs/screenshots/leakproof/` and/or the recording, plus `docs/ADVANCED-RUN.md` |

## Order of operations

1. Do the **hosted tutorial** on fiber.world and capture the four Basic shots. They must come from the
   tutorial UI (it has the buttons "Decrypt without key" and "Decrypt result"), not from this app.
2. Commit `docs/screenshots/basic/` and push. Open the GitHub folder URL and confirm the images render.
3. Submit Basic. This locks in Advanced prize eligibility.
4. Run this app on Testnet, following the pre-flight checklist and timings in `docs/DEMO-SCRIPT.md`. Capture the
   demo sequence, fill `docs/ADVANCED-RUN.md` with the real values, commit and push.
5. Submit Advanced with the repo URL and the demo link.

## Eligibility and safety checklist

- [ ] Joined the Build on CKB Telegram group; handle included in Basic.
- [ ] Testnet only. Never Mainnet CKB. Fund Buyer A and Seller C at their **separate** addresses.
- [ ] Both Basic screenshots and demo shots are committed and publicly viewable in the repo.
- [ ] No private keys, seed phrases, recovery phrases, passwords, exported credentials or browser-storage
      dumps anywhere in the submission. Browser storage holds node keys — do not screenshot it.
- [ ] Reflection written in your own words, answering the required question plus at least two others.
- [ ] `npm run typecheck`, `npm test` and `npm run build` pass on the pushed commit.

## Texts to paste

Repo field:

```
Leakproof Briefs — one brief, one sealed copy per buyer on CKB Testnet.
Repo: <URL>
README explains what changed from the starter (per-buyer handles, per-copy keys, public copy ledger) and how to run it.
Demo evidence: docs/screenshots/leakproof/ and docs/ADVANCED-RUN.md
Basic evidence: docs/screenshots/basic/ (hosted fiber.world tutorial) and docs/REFLECTION.md
```

Demo field:

```
Demo (offer -> payment -> unlock): <recording URL or repo folder URL>
Live run record with invoice, payment hash, fee and decrypted-match check: docs/ADVANCED-RUN.md
```
