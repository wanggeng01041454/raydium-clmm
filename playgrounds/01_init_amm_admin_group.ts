import { PublicKey } from "@solana/web3.js";
import { BaseInstruction } from "./sdk/baseInstruction";
import { ProgramAddress } from "./utils/constants";
import { sendTransaction } from "./utils";
import { wallet, wallet2, wallet3 } from "./config";
import { getAdminGroupInfo } from "./01_get_amm_admin_group";

async function main() {
  console.log("Initializing AMM Admin Group...");

  // 生成管理员组的PDA地址
  const [adminGroupPubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from("admin_group")],
    ProgramAddress
  );

  console.log("Admin Group PDA:", adminGroupPubkey.toBase58());

  // 设置管理员权限
  const adminParams = {
    feeKeeper: wallet.publicKey, // 费用管理员
    rewardConfigManager: wallet2.publicKey, // 奖励配置管理员
    rewardClaimManager: wallet3.publicKey, // 奖励领取管理员
    poolManager: wallet.publicKey, // 池子管理员
    emergencyManager: wallet2.publicKey, // 紧急情况管理员
    normalManager: wallet3.publicKey, // 普通管理员
  };

  try {
    const instruction = await BaseInstruction.initAmmAdminGroupInstruction(
      adminParams
    );

    console.log("Sending transaction...");
    const txHash = await sendTransaction(wallet, [instruction]);
    console.log("Transaction successful!");
    console.log("Transaction hash:", txHash);
    console.log("Admin Group initialized:", adminGroupPubkey.toBase58());

    await getAdminGroupInfo();
  } catch (error) {
    console.error("Error initializing admin group:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
