import { BaseInstruction } from "./sdk/baseInstruction";
import { ProgramAddress, TokenAddress } from "./utils/constants";
import { sendTransaction } from "./utils";
import {
  wallet,
  wallet2,
  connection,
  token0KeyPair,
  token1KeyPair,
  AMM_CONFIG,
} from "./config";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "bn.js";
import { createMintToken } from "./utils/splTokenUtils";
import { getPdaAmmConfigId, getPdaPoolId } from "./utils/pda";

async function main() {
  // 用户可以手动配置 token0Mint、token1Mint 和 ammConfigId
  const token0Mint = await createMintToken(wallet, token0KeyPair);
  const token1Mint = await createMintToken(wallet, token1KeyPair);
  const ammConfigId = getPdaAmmConfigId(
    ProgramAddress,
    AMM_CONFIG.configIndex
  ).publicKey;

  const [mint0, mint1] =
    token0Mint.toBuffer().compare(token1Mint.toBuffer()) > 0
      ? [token1Mint, token0Mint]
      : [token0Mint, token1Mint];

  console.log({
    token0Mint: token0Mint.toBase58(),
    token1Mint: token1Mint.toBase58(),
    mint0: mint0.toBase58(),
    mint1: mint1.toBase58(),
    poolId: getPdaPoolId(
      ProgramAddress,
      ammConfigId,
      mint0,
      mint1
    ).publicKey.toBase58(),
  });

  try {
    const instruction = await BaseInstruction.createPoolInstruction(
      wallet.publicKey, // poolCreator
      wallet.publicKey, // poolManager
      ammConfigId,
      mint0,
      TOKEN_PROGRAM_ID,
      mint1,
      TOKEN_PROGRAM_ID,
      new BN("583337074090354317156"), // 1000
      new BN("0")
    );

    const txHash = await sendTransaction(wallet, [instruction]);
    console.log("txHash ===>", txHash);
  } catch (error) {
    console.error("Error creating AMM config:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
