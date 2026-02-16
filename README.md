# NOORIBANK

A decentralized banking system built on blockchain technology, providing traditional banking services in a trustless environment.

## Overview

NOORIBANK is a comprehensive DeFi banking platform that combines traditional banking services with blockchain technology. It offers features like savings accounts, collateralized lending, and asset management through a secure and decentralized architecture.

## Architecture

The project is structured in four main layers:

### 1. Core Layer (`_smart-contract/core/`)
- Contains the primary smart contracts
- Manages native token and vault operations
- Handles core banking functionalities

### 2. Relay Layer (`_smart-contract/relay/`)
- Serves as middleware/bridge
- Manages cross-contract communications
- Handles transaction routing and validation

### 3. Client Layer (`_smart-contract/client/`)
- Manages user-facing smart contract interactions
- Handles client-side operations
- Provides interface abstractions

### 4. UI Layer (`_ui/`)
- React-based frontend application
- User interface for banking operations
- Admin dashboard for system management

## Key Features

### Token System
- ERC20-compatible native token (NOORI)
- Upgradeable smart contract architecture
- Built-in security features:
  - Pausable functionality
  - Blacklisting capability
  - Role-based access control

### Vault System
1. **Account Management**
   - Unique account IDs
   - Wallet address association
   - Required memo system for deposits
   - Multi-token balance tracking

2. **Savings Features**
   - 10% Annual Interest Rate (APR)
   - Daily compound interest
   - Native token deposits
   - Flexible withdrawal system

3. **Lending System**
   - Collateralized lending (ETH & ERC20 tokens)
   - 60% Loan-to-Value (LTV) ratio
   - 5% APR on loans
   - Automated liquidation system

4. **Transaction Management**
   Fee Structure:
   - Transfers: 0.1%
   - Withdrawals: 0.5%
   - Deposits: Free

## Security Features

- Proxy pattern for contract upgradeability
- Role-based access control (RBAC)
- Emergency pause functionality
- Blacklisting capabilities
- Reentrancy protection
- Comprehensive input validation

## Technical Stack

### Smart Contracts
- Solidity ^0.8.19
- Hardhat development environment
- OpenZeppelin contract libraries
- ERC20 & ERC1967 (Proxy) standards

### Frontend
- React.js
- Vite build tool
- Web3.js/Ethers.js for blockchain interaction
- Modern UI/UX design principles

## Getting Started

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0
- Hardhat
- MetaMask or similar Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/nooribank.git
cd nooribank
```

2. Install dependencies for each layer:

```bash
# Core Layer
cd _smart-contract/core
npm install

# Relay Layer
cd ../relay
npm install

# Client Layer
cd ../client
npm install

# UI Layer
cd ../../_ui
npm install
```

3. Set up environment variables:
Create `.env` files in each respective directory following the `.env.example` templates.

### Running the Project

1. Start the development environment:
```bash
# Deploy contracts (from _smart-contract/core)
npx hardhat run scripts/deploy.js --network <your-network>

# Start frontend (from _ui)
npm run dev
```

2. Access the application at `http://localhost:5173`

## Testing

```bash
# Run smart contract tests
cd _smart-contract/core
npx hardhat test

# Run frontend tests
cd _ui
npm test
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenZeppelin for smart contract libraries
- Hardhat development environment
- React and Vite communities

## Security

For security concerns, please email security@nooribank.com
