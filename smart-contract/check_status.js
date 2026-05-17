const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function main() {
    const mnemonic = process.env.MNEMONIC;
    const rpcUrl = process.env.SEPOLIA_RPC_URL;

    if (!mnemonic || !rpcUrl) {
        console.error("Missing env vars");
        return;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);

    console.log("Checking status for:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");

    const nonce = await provider.getTransactionCount(wallet.address);
    console.log("Confirmed Transaction Count (Nonce):", nonce);

    // Note: pending nonce support varies by provider
    const pendingNonce = await provider.getTransactionCount(wallet.address, "pending");
    console.log("Pending Transaction Count (Nonce):", pendingNonce);

    if (pendingNonce > nonce) {
        console.log(`WARNING: You have ${pendingNonce - nonce} pending transaction(s) stuck in the mempool!`);
        console.log("This is why new deployments are waiting.");
    } else {
        console.log("No stuck transactions detected.");
    }
}

main();
