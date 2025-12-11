

# 🪙 SCASH Wallet

An open-source lightweight wallet for the **SCASH blockchain**, designed with **security** and **usability** in mind.
All private keys, mnemonics, and signing operations are performed **locally on the client side**, never transmitted over the network.

## ✨ Features

* 🔑 **Address Management**

  * Generate and import mnemonics
  * Derive addresses using BIP32 / BIP84 paths
  * Strict address format validation

* 💰 **Balance & Transactions**

  * Query balances and UTXOs by address
  * Build and sign transactions locally
  * Broadcast signed transactions via RPC node
  * Change outputs handled automatically

* 🔒 **Security First**

  * AES-encrypted local wallet files
  * Password-protected storage (never sent over the network)
  * Signing process can be performed **offline**, similar to hardware wallets

* ⚡ **Tech Stack**

  * **Frontend**: Next.js (React)
  * **Backend**: Nest.js + Prisma
  * **Blockchain Communication**: SCASH RPC
  * **Encryption**: AES for wallet storage

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/scash-wallet.git
cd scash-wallet

# Install dependencies
npm install

# Run development server
npm run dev
```

## 📖 Usage

1. Create or import a wallet using mnemonic.
2. Query balances and transactions by address.
3. Construct and sign transactions **locally** (no private keys ever leave the device).
4. Broadcast signed transactions via your own SCASH node.

## 🛡️ Security Model

* Wallet files are stored locally and encrypted with AES.
* User password is required for decryption and **never transmitted**.
* Signing happens locally or offline — similar to how hardware wallets work via Bluetooth or USB.

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests to help improve the SCASH Wallet.

## 📜 License

This project is released under the [MIT License](./LICENSE).


