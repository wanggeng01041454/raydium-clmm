import { PublicKey } from "@solana/web3.js";
import { BaseInstruction } from "./sdk/baseInstruction";
import { ProgramAddress } from "./utils/constants";
// import { sendTransaction } from "./utils";
import { serializeToBase58 } from "./utils";
import { mainnetConnection as connection } from "./config";

const rewardClaimManagerPublicKey = new PublicKey(
  "94RrsPXVPv49wtJzEA8c4UaFc6jRq7Q1kEB2xw47mF2a"
);
const rewardClaimManagerSecretKey = [
  233, 225, 247, 125, 28, 86, 236, 210, 2, 184, 154, 185, 201, 245, 139, 220,
  32, 210, 134, 240, 137, 21, 214, 4, 164, 163, 55, 36, 172, 218, 220, 127, 119,
  190, 88, 207, 34, 164, 156, 121, 23, 50, 226, 107, 54, 192, 74, 6, 188, 118,
  6, 73, 137, 171, 236, 67, 116, 93, 38, 228, 179, 95, 106, 115,
];

// async function test() {
//   const keypair = Keypair.generate();

//   console.log("publicKey ==>", keypair.publicKey.toBase58());
//   console.log("secretKey ===>", [...keypair.secretKey]);
// }

async function main() {
  const lichen_PublicKey = new PublicKey(
    "F7sS8YTr47ta16jmT3R48omZPtuNMtkwV65LpGPYEn6M"
  );

  // 设置管理员权限
  const adminParams = {
    feeKeeper: lichen_PublicKey, // 费用管理员
    rewardConfigManager: lichen_PublicKey, // 奖励配置管理员
    rewardClaimManager: rewardClaimManagerPublicKey, // 奖励领取管理员
    poolManager: lichen_PublicKey, // 池子管理员
    emergencyManager: lichen_PublicKey, // 紧急情况管理员
    normalManager: lichen_PublicKey, // 普通管理员
  };

  try {
    const instruction = await BaseInstruction.initAmmAdminGroupInstruction(
      adminParams
    );

    const base58 = await serializeToBase58(
      connection,
      new PublicKey("9ZG4mYtayKedcDkRbpGAc13uQDT2Ag9twJBbuwia9Lqg"),
      [instruction]
    );
    console.log(base58);
  } catch (error) {
    console.error("Error initializing admin group:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
