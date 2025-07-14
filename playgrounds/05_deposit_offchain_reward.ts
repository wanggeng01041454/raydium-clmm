import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import BN from "bn.js";
import { BaseInstruction } from "./sdk/baseInstruction";
import { PublicKey } from "@solana/web3.js";
import { sendTransaction } from "./utils";
import { wallet, poolId as _poolId, token0Mint, connection } from "./config";
import { createAccountToken, mintToken } from "./utils/splTokenUtils";

async function main() {
  // 示例参数 - 根据实际情况修改
  const depositAmount = 10 * 10 ** 6;
  const tokenMint = token0Mint;
  const poolId = _poolId;

  // 检查 payerTokenAccount 是否存在，不存在则创建
  let payerTokenAccount: PublicKey;

  try {
    // 获取关联代币账户地址
    const associatedTokenAddress = await getAssociatedTokenAddress(
      tokenMint,
      wallet.publicKey
    );

    // 尝试获取账户信息，如果账户存在则使用现有账户
    await getAccount(connection, associatedTokenAddress);
    payerTokenAccount = associatedTokenAddress;
    console.log("使用现有的 payerTokenAccount:", payerTokenAccount.toString());
  } catch (error) {
    // 账户不存在，创建新账户
    console.log("payerTokenAccount 不存在，正在创建新账户...");
    payerTokenAccount = await createAccountToken(
      wallet,
      wallet.publicKey,
      tokenMint
    );
    console.log("成功创建 payerTokenAccount:", payerTokenAccount.toString());

    await mintToken(wallet, payerTokenAccount, tokenMint, depositAmount * 2);
  }

  try {
    const instruction = await BaseInstruction.depositOffchainRewardInstruction(
      poolId,
      wallet.publicKey, // payer
      wallet.publicKey, // authority (需要是 reward_config_manager)
      tokenMint, // tokenMint
      payerTokenAccount, // payerTokenAccount
      TOKEN_PROGRAM_ID, // tokenProgram
      new BN(depositAmount) // amount
    );

    const txHash = await sendTransaction(wallet, [instruction]);
    console.log("txHash ===>", txHash);
  } catch (error) {
    console.error("Error depositing offchain reward:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
