import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import BN from "bn.js";
import { BaseInstruction } from "./sdk/baseInstruction";
import { sendTransaction } from "./utils";
import { wallet, poolId as _poolId, token0Mint } from "./config";

async function main() {
  const claimer = wallet.publicKey;
  const poolId = _poolId;
  const tokenMint = token0Mint;

  const claimerTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    claimer
  );

  try {
    const instruction = await BaseInstruction.claimOffchainRewardInstruction(
      poolId,
      claimer,
      wallet.publicKey,
      tokenMint,
      claimerTokenAccount,
      TOKEN_PROGRAM_ID,
      new BN(5 * 10 ** 6)
    );

    const txHash = await sendTransaction(wallet, [instruction]);
    console.log("txHash ===>", txHash);
  } catch (error) {
    console.error("Error claiming offchain reward:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
