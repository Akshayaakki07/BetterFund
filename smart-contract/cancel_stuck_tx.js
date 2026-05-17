const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function main() {
    const mnemonic = process.env.MNEMONIC;
    const rpcUrl = process.env.SEPOLIA_RPC_URL;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);

    console.log("Wallet:", wallet.address);

    // Loop to clear all stuck transactions
    while (true) {
        const nonce = await provider.getTransactionCount(wallet.address, "latest");
        const pendingNonce = await provider.getTransactionCount(wallet.address, "pending");

        console.log(`Status: Confirmed Nonce: ${nonce}, Pending Nonce: ${pendingNonce}`);

        if (pendingNonce <= nonce) {
            console.log("All stuck transactions cleared!");
            break;
        }

        console.log(`Clearing nonce ${nonce}...`);

        // Hardcode massive gas to force replacement
        // Using 200 Gwei which should be plenty for Sepolia but reasonable
        const maxFeePerGas = ethers.parseUnits("200", "gwei");
        const maxPriorityFeePerGas = ethers.parseUnits("200", "gwei");

        try {
            const tx = await wallet.sendTransaction({
                to: wallet.address,
                value: 0,
                nonce: nonce,
                maxFeePerGas,
                maxPriorityFeePerGas
            });

            console.log("Cancellation sent:", tx.hash);
            console.log("Waiting for confirmation...");
            await tx.wait();
            console.log("Confirmed!");
        } catch (error) {
            console.error("Error cancelling:", error.message);
            // If underpriced, wait and retry (loop will re-evaluate)
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

main();
