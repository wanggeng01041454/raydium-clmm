import { PublicKey } from "@solana/web3.js";
import { BaseInstruction } from "./sdk/baseInstruction";
import { ProgramAddress } from "./utils/constants";
import { serializeToBase58 } from "./utils";
import { mainnetConnection as connection } from "./config";

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

  const updateParams = {
    // feeKeeper: wallet.publicKey,
    // rewardConfigManager: wallet.publicKey,
    rewardClaimManager: new PublicKey(
      "GCEwJ93BrbX9JkjtJEzZcVPnz3a6wDmQuEp1zojmEmyN"
    ),
    // poolManager: wallet.publicKey,
    // emergencyManager: wallet.publicKey,
    // normalManager: wallet.publicKey,
  };

  try {
    const instruction = await BaseInstruction.updateAmmAdminGroupInstruction(
      updateParams
    );

    const base58 = await serializeToBase58(
      connection,
      new PublicKey("9ZG4mYtayKedcDkRbpGAc13uQDT2Ag9twJBbuwia9Lqg"),
      [instruction]
    );
    console.log(base58);
  } catch (error) {
    console.error("Error updating admin group:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
