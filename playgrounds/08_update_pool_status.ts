import { PublicKey } from "@solana/web3.js";
import { BaseInstruction } from "./sdk/baseInstruction";
import { sendTransaction } from "./utils";
import { wallet, poolId, connection } from "./config";

async function main() {
  try {
    const instruction = await BaseInstruction.updatePoolStatusInstruction(
      wallet.publicKey,
      poolId,
      0
    );

    const txHash = await sendTransaction(connection, wallet, [instruction]);
    console.log("txHash ===>", txHash);
  } catch (error) {
    console.error("Error withdrawing offchain reward:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
