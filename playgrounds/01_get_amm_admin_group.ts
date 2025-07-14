import { Connection, PublicKey } from "@solana/web3.js";
import { getAmmV3Program } from "./sdk/baseInstruction";
import { ProgramAddress } from "./utils/constants";
import { mainnetConnection as connection } from "./config";

/**
 * 获取管理员组信息
 */
export async function getAdminGroupInfo() {
  const [adminGroupPubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from("admin_group")],
    ProgramAddress
  );

  console.log("adminGroupPubkey =>", adminGroupPubkey.toBase58());

  // 验证账户是否创建成功
  const accountInfo = await connection.getAccountInfo(adminGroupPubkey);
  if (accountInfo) {
    console.log("✅ Admin Group account created successfully");
    console.log("Account data length:", accountInfo.data.length);

    console.log(decodeAdminGroupInfo(accountInfo.data));
    // console.log(await decodeAdminGroupInfo2(adminGroupPubkey));
  } else {
    console.log("❌ Failed to create Admin Group account");
  }
}

/**
 * 解码管理员组信息
 */
function decodeAdminGroupInfo(data: Buffer) {
  const program = getAmmV3Program();

  const adminGroup = program.coder.accounts.decode("ammAdminGroup", data);

  console.log({
    feeKeeper: adminGroup.feeKeeper.toBase58(),
    rewardConfigManager: adminGroup.rewardConfigManager.toBase58(),
    rewardClaimManager: adminGroup.rewardClaimManager.toBase58(),
    poolManager: adminGroup.poolManager.toBase58(),
    emergencyManager: adminGroup.emergencyManager.toBase58(),
    normalManager: adminGroup.normalManager.toBase58(),
  });
}

/**
 * 解码管理员组信息，其他方式
 */
async function decodeAdminGroupInfo2(adminGroupPubkey: PublicKey) {
  const program = getAmmV3Program();

  return await program.account.ammAdminGroup.fetch(adminGroupPubkey);
}

if (require.main === module) {
  getAdminGroupInfo().catch(console.error);
}
