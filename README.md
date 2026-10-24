# Orion: Distributed Multi-Tenant Control Plane & Policy Sync Service

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=flat-square&logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=flat-square)]()

Orion is a production-grade, distributed control-plane daemon designed to act as the single source of truth for multi-tenant AI governance policies, cluster-wide configuration synchronization, and zero-trust edge reconciliation. 

---

## 🏗️ Core Architecture & Design

In cloud-native AI infrastructures, decentralized edge proxies or Kubernetes pods require atomic, reliable synchronization of security configurations (such as model tier restrictions, DLP toggles, and tenant identifiers) without manual restarts or full-state re-fetches. Orion solves this via:

1. **Atomic State & Monotonic Versioning:** Manages tenant security manifests with incrementing version IDs (`v1`, `v2`, etc.) to prevent race conditions during decentralized rollouts.
2. **Cryptographic Zero-Trust Signing:** Utilizes **HMAC-SHA256 payload signing** so edge nodes can cryptographically verify policy authenticity before applying configuration updates.
3. **Real-Time Config Distribution:** Maintains persistent WebSocket connections with edge nodes to instantly broadcast policy diffs and state mutations across the cluster.

---

## 🚀 Key Features

- **Administrative Policy Mutation API (`PUT /v1/control/policies`):** Upserts tenant security manifests, increments version epochs, and automatically computes cryptographic signatures.
- **Edge Node Synchronization API (`GET /v1/control/manifests`):** Allows edge proxy nodes to fetch single-tenant policies or full cluster synchronization epochs.
- **Real-Time Event Stream:** Pushes configuration updates to connected cluster nodes instantly upon state commit.
- **Automated Integration Test Suite:** Includes an end-to-end verification harness ensuring zero-downtime policy propagation.

---

## 📁 Project Structure

```text
orion-control-plane/
├── src/
│   └── controlPlane.ts       # Core Fastify control-plane engine, HMAC signer, and WebSocket broadcaster
├── test/
│   └── verifyOrion.ts        # Automated integration test suite (server lifecycle & sync verification)
├── package.json              # Project dependencies and run scripts
└── tsconfig.json             # TypeScript compiler configuration


⚙️ Getting Started & Local Installation
Prerequisites
Node.js (v18+ recommended)

npm or yarn


Installation
Clone the repository and install dependencies:

git clone [https://github.com/Nexistrike1323/orion-control-plane.git](https://github.com/Nexistrike1323/orion-control-plane.git)
cd orion-control-plane
npm install



