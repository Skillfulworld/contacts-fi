# Settle Exchange

**A simple USDC payment layer for people, wallets, and everyday transactions on Arc.**

Settle Exchange makes sending USDC easier by turning wallet addresses into reusable contacts.

Instead of remembering or copying wallet addresses every time you pay someone, save a person once, attach their different wallets and networks, and choose the right destination when you need to send.

Settle Exchange is built around a simple idea:

> **Your contacts should be easier to remember than your wallet addresses.**

## What Settle Exchange does

### Contacts

Save people, not addresses. Attach multiple wallet addresses to a single contact — different providers, different networks — and choose where to send when you need to pay.

When sending, choose:

**Contact → Wallet → Token → Amount → Send**

This makes recurring USDC payments much simpler than repeatedly copying and pasting addresses.

### Send USDC

Send USDC directly to any saved wallet address on Arc Mainnet.

The recipient does not need a Settle Exchange account to receive funds. Settle Exchange makes the sender's payment workflow easier while the transaction settles on-chain.

### Swap

Settle Exchange includes a working DEX swap interface on **Arc Mainnet**, powered by Uniswap V3, allowing users to swap supported assets without leaving the application.

### Bridge

Settle Exchange includes a CCTP V2-powered USDC bridge for moving USDC between supported chains — Arc, Ethereum, Base, Arbitrum, Optimism, Polygon, and Avalanche.

### Points

Settle Exchange includes an on-chain points system powered by a Settle Exchange smart contract deployed on Arc Mainnet.

The points system supports:

* Daily check-ins with a 0.01 USDC platform contribution per check-in
* 7-day streak reward schedule (5, 6, 7, 8, 9, 10, 15 points per day)
* 30-day grand prize (+45 bonus points)
* Verifiable, wallet-tied point balances stored permanently on Arc
* Future tasks and activity-based rewards

Points are tied to a wallet address. When a user reconnects their wallet, their full points history reappears automatically.

## Why Arc

Settle Exchange is built around **USDC on Arc**.

Arc provides the settlement layer for all Settle Exchange transactions. On Arc, USDC is the native gas token — users pay transaction fees in USDC with no separate gas token required.

Settle Exchange currently uses:

* Arc Mainnet (chain ID 5042)
* USDC as the native asset and gas token
* CCTP V2 for cross-chain USDC transfers
* Uniswap V3 on Arc for DEX swaps
* On-chain Settle Exchange Points contract

The goal is to make Arc practical for an everyday consumer payment experience — blockchain interaction that works without requiring users to understand it first.

## Current status

**Live on Arc Mainnet**

Settle Exchange currently has working:

* Contact-based USDC payments
* Arc Mainnet transactions
* DEX swaps on Arc Mainnet (Uniswap V3)
* CCTP V2 USDC bridging (7 supported chains)
* Wallet connection (MetaMask and EVM wallets)
* On-chain activity tracking
* On-chain Settle Exchange Points contract
* Points dashboard and daily check-in experience
* Wallet-tied point persistence

## Architecture

```text
                     Settle Exchange
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       Contacts           Payments          Points
          │                 │                 │
          │              USDC on Arc     Points Contract
          │                 │            (Arc Mainnet)
          └─────────────────┴─────────────────┘
                            │
                       Arc Mainnet
                            │
                 Circle / Arc Infrastructure
                   │                   │
              Uniswap V3           CCTP V2 Bridge
           (DEX on Arc)         (Cross-chain USDC)
```

## Smart Contract

The Settle Exchange Points contract is deployed on Arc Mainnet.

**Address:** `0xaf75c1b6EDeE3Cf03FF1282145dD7878EcFfB7B0`

The contract:
- Records daily check-ins with a 20-hour cooldown
- Enforces streak logic and awards points per the weekly schedule
- Collects a 0.01 USDC platform contribution per check-in
- Emits on-chain events for every point-earning action
- Owner-controlled fee adjustment (max 0.05 USDC, can be set to zero)
- Emergency pause capability

## Built for everyday payments

Most crypto payment experiences begin with a wallet address.

Settle Exchange starts with **people**.

A wallet address is useful for a blockchain, but a contact is useful for a human.

Settle Exchange connects the two.

## Links

* **Live App:** https://settlex.vercel.app
* **GitHub:** https://github.com/Skillfulworld/settlex
* **Arc:** https://www.arc.io/
* **Arc Documentation:** https://docs.arc.io/
* **Points Contract:** https://explorer.arc.io/address/0xaf75c1b6EDeE3Cf03FF1282145dD7878EcFfB7B0

## Development

This project is actively being developed toward a broader consumer payment experience on Arc.

Future development may include:

* Payment requests and payment links
* QR code payments
* Verified on-chain task rewards (swap, bridge, send milestones)
* Operator-signed task verification system
* Developer APIs
* Agentic payments
* Messaging

These are planned directions and are not part of the current live application.

## Disclaimer

Settle Exchange is an independent application built on and integrated with Arc and Circle infrastructure. Settle Exchange does not operate Arc, Circle, USDC, or CCTP.

Users are responsible for reviewing transactions before signing and for managing their own wallets and funds.
