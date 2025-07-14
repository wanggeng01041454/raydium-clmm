import { PublicKey } from "@solana/web3.js";
import { BaseInstruction } from "./sdk/baseInstruction";
import { ProgramAddress } from "./utils/constants";
import { sendTransaction } from "./utils";
import { connection, wallet, wallet2 } from "./config";

async function main() {
  console.log("Updating AMM Admin Group...");

  // 获取管理员组的PDA地址
  const [adminGroupPubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from("admin_group")],
    ProgramAddress
  );

  console.log("Admin Group PDA:", adminGroupPubkey.toBase58());

  // 检查管理员组是否存在
  const accountInfo = await connection.getAccountInfo(adminGroupPubkey);
  if (!accountInfo) {
    console.log(
      "❌ Admin Group does not exist. Please run 01_init_amm_admin_group.ts first"
    );
    return;
  }

  // 设置要更新的参数 - 只更新需要修改的字段
  const updateParams = {
    feeKeeper: wallet.publicKey,
    rewardConfigManager: wallet.publicKey,
    rewardClaimManager: wallet.publicKey,
    poolManager: wallet.publicKey,
    emergencyManager: wallet.publicKey,
    normalManager: wallet.publicKey,
  };

  try {
    const instruction = await BaseInstruction.updateAmmAdminGroupInstruction(
      updateParams
    );

    console.log("Sending transaction...");
    const txHash = await sendTransaction(wallet, [instruction]);
    console.log("Transaction successful!");
    console.log("Transaction hash:", txHash);
    console.log("Admin Group updated:", adminGroupPubkey.toBase58());

    // 验证更新是否成功
    console.log("✅ Admin Group updated successfully");
  } catch (error) {
    console.error("Error updating admin group:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
