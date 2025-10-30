# CloakVote

Executive Summary
CloakVote is an anonymous voting system that runs private ballot casting and tallying directly on-chain using Zama FHEVM. Ballots remain encrypted throughout the election lifecycle; only final tallies are revealed with public verifiability. Fully Homomorphic Encryption (FHE) ensures the chain can compute over ciphertexts without seeing voter choices.

—

Design Goals vs Constraints
- Goals
  - Anonymous ballots with on‑chain verifiable tally
  - Simple integration for DAOs and governance tools
  - Clear operational procedures (keys, tally, reveal)
  - Minimal trusted surface; rely on Zama FHEVM for secure computation
- Constraints
  - FHE computations have higher gas/runtime footprint
  - Complex voting rules may require off‑chain encoding pipelines
  - Mempool metadata may leak timing/participation (mitigate with relays)

—

High‑Level Flow
1) Setup
   - Create election; publish election parameters and FHE public key
2) Cast
   - Voter encrypts selection client‑side (FHE) and submits ciphertext
3) Close & Tally (Zama FHEVM)
   - Contract aggregates encrypted ballots; produces encrypted tally + proofs
4) Reveal
   - Authorized tally authority reveals final numbers; anyone verifies proofs

ASCII outline
```
Voter → FHE Encrypt → Cipher Ballot → FHEVM Aggregate → Encrypted Tally → Verified Reveal
```

—

User Stories
- As a DAO admin, I want to spin up a private vote that members can verify
- As a voter, I want my choice to remain secret even from validators and hosts
- As an auditor, I want to independently verify the tally without seeing votes
- As an integrator, I want a clean API to create, close, tally, and reveal

—

Deployment Matrix
```
| Env     | Chain          | Keys                   | Submission           | Tally Engine     |
|---------|-----------------|------------------------|----------------------|------------------|
| Dev     | Hardhat local   | Dev FHE keys           | Direct               | Local FHEVM node |
| Test    | Sepolia         | Rotating per‑election  | Optional relayer     | Zama FHEVM       |
| Prod    | Mainnet/L2      | Threshold authority    | Relayer / stealth tx | Zama FHEVM       |
```

—

Compliance Notes
- Cryptography: uses FHE (Zama FHEVM) for homomorphic aggregation; no ballot plaintexts stored on-chain
- Data protection: minimizes metadata; recommend relayers to reduce correlation
- Governance records: retains public proofs and election parameters for audit trails

—

Troubleshooting
- Symptom: High gas during tally
  - Cause: Large ballot set + FHE ops
  - Fix: Batch tally, shard elections, or increase off‑chain preprocessing
- Symptom: Ballot submission linkability
  - Cause: Direct wallet submissions
  - Fix: Use relayers/mixers; randomize submission windows
- Symptom: Inconsistent reveal
  - Cause: Wrong key/proof set
  - Fix: Recompute proofs; rotate keys; re‑publish artifacts

—

API Sketch (subject to change)
- createElection(params, fhePubKey)
- cast(bytes ciphertext)
- closeElection()
- tally()
- reveal(bytes result, bytes proofs)
- artifacts() → bytes

—

Changelog
- 0.1.0: Initial draft with Zama FHEVM tally, cast/close/reveal flows

—

Credits & License
Built on Zama FHEVM and open cryptographic primitives.
MIT — see LICENSE.
