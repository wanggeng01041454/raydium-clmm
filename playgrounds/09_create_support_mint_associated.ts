import { PublicKey } from "@solana/web3.js";
import { BaseInstruction } from "./sdk/baseInstruction";
import { sendTransaction } from "./utils";
import { connection, wallet } from "./config";
import {
  createMint,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

async function main() {
  const tokenMint = await createMint(
    connection,
    wallet,
    wallet.publicKey,
    null,
    6,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  try {
    const instruction =
      await BaseInstruction.createSupportMintAssociatedInstruction(
        wallet.publicKey,
        tokenMint
      );

    const txHash = await sendTransaction(wallet, [instruction]);
    console.log("txHash ===>", txHash);
  } catch (error) {
    console.error("Error withdrawing offchain reward:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
