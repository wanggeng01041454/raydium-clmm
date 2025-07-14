import { MultisigSDK, MultisigUtils } from "./sdk.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { connection, wallet, wallet2, wallet3 } from "../config/index.js";

import { createKey } from "./config.js";

const creator = wallet;
const member2 = wallet2;
const member3 = wallet3;

async function main() {
  // 为创建者充值
  const signature = await connection.requestAirdrop(
    creator.publicKey,
    10 * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature);

  // 2. 生成多重签名 PDA
  const [multisigPda] = MultisigUtils.getMultisigPda(createKey.publicKey);
  console.log("多重签名 PDA:", multisigPda.toBase58());

  // 3. 初始化 SDK
  const sdk = new MultisigSDK({
    connection,
    multisigPda,
  });

  try {
    // 4. 创建多重签名钱包
    console.log("创建多重签名钱包...");
    const createSignature = await sdk.createMultisig({
      createKey,
      creator,
      threshold: 2, // 需要2个签名
      members: [
        {
          key: creator.publicKey,
          permissions: MultisigUtils.allPermissions(),
        },
        {
          key: member2.publicKey,
          permissions: MultisigUtils.createPermissions(["vote"]),
        },
        {
          key: member3.publicKey,
          permissions: MultisigUtils.createPermissions(["vote"]),
        },
      ],
    });
    console.log("✅ 多重签名钱包创建成功:", createSignature);

    // 5. 为 Vault 充值
    console.log("为 Vault 充值...");
    const airdropSignature = await sdk.airdropToVault(10);
    console.log("✅ Vault 充值成功:", airdropSignature);

    // 6. 获取多重签名钱包信息
    console.log("获取多重签名钱包信息...");
    const multisigInfo = await sdk.getMultisigInfo();
    console.log("✅ 多重签名钱包信息:", {
      地址: multisigInfo.multisigPda,
      阈值: multisigInfo.threshold,
      成员数量: multisigInfo.memberCount,
      Vault余额: multisigInfo.vault.balance,
      成员列表: multisigInfo.members,
    });
  } catch (error) {
    console.error("创建多重签名钱包失败:", error);
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
