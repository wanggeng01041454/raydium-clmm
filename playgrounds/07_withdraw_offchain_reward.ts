import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import BN from "bn.js";
import { BaseInstruction } from "./sdk/baseInstruction";
import { sendTransaction } from "./utils";
import { wallet, token0Mint, poolId as _poolId } from "./config";

async function main() {
  const poolId = _poolId;
  const tokenMint = token0Mint;

  const receiverTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    wallet.publicKey
  );

  try {
    const instruction = await BaseInstruction.withdrawOffchainRewardInstruction(
      poolId,
      wallet.publicKey,
      tokenMint,
      receiverTokenAccount,
      TOKEN_PROGRAM_ID,
      new BN(1 * 10 ** 6)
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
