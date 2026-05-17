const { ethers } = require("ethers");
const fs = require("fs-extra");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const compiledFactory = require("./build/CampaignFactory.json");

async function main() {
    const mnemonic = process.env.MNEMONIC;
    const rpcUrl = process.env.SEPOLIA_RPC_URL;

    if (!mnemonic || !rpcUrl) {
        console.error("Please set MNEMONIC and SEPOLIA_RPC_URL in .env file");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);

    console.log("Attempting to deploy from account", wallet.address);

    const factory = new ethers.ContractFactory(
        compiledFactory.interface,
        compiledFactory.bytecode,
        wallet
    );

    const contract = await factory.deploy({
        maxFeePerGas: ethers.parseUnits("30", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("30", "gwei"),
        gasLimit: 1200000
    });
    console.log("Deployment started, waiting for confirmation...");

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log("Contract deployed to", address);

    // Save address
    const addressPath = path.resolve(__dirname, "address_sepolia.txt");
    fs.writeFileSync(addressPath, address);
    console.log("Address saved to", addressPath);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
