const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC).connect(provider);
    const balance = await provider.getBalance(wallet.address);
    console.log("BALANCE_CHECK:", ethers.formatEther(balance));
}
main();
