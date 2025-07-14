import { MultisigSDK, MultisigUtils } from "./sdk.js";

import { connection, wallet, wallet2, wallet3 } from "../config/index.js";
import { createKey } from "./config.js";
import { BaseInstruction } from "../sdk/baseInstruction.js";
import { createMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const creator = wallet;
const member2 = wallet2;
const member3 = wallet3;

async function main() {
  const [multisigPda] = MultisigUtils.getMultisigPda(createKey.publicKey);
  const sdk = new MultisigSDK({ connection, multisigPda });
  const VAULT_INDEX = 1;

  const normalManager = sdk.getVaultPda(VAULT_INDEX);

  try {
    // 首先创建一个 Token-2022 mint 用于测试
    console.log("正在创建 Token-2022 mint...");
    const tokenMint = await createMint(
      connection,
      wallet, // 由 wallet 临时支付创建费用
      wallet.publicKey, // mint authority
      null, // freeze authority
      6, // decimals
      undefined, // keypair
      undefined, // confirmOptions
      TOKEN_2022_PROGRAM_ID // 使用 Token-2022 程序
    );

    console.log("✅ Token-2022 mint 创建成功:", tokenMint.toString());
    console.log("📋 准备创建支持 mint 关联账户...");

    // 创建支持 mint 关联账户的指令
    const instruction =
      await BaseInstruction.createSupportMintAssociatedInstruction(
        normalManager, // authority (normal_manager)
        tokenMint // Token-2022 mint
      );

    const proposalResult = await sdk.createProposal({
      feePayer: creator,
      creator,
      instructions: [instruction],
      vaultIndex: VAULT_INDEX,
      memo: `添加 Token-2022 mint 支持: ${tokenMint.toString().slice(0, 8)}...`,
    });

    console.log("✅ 创建支持 mint 关联账户提案创建成功:", proposalResult);

    console.log("开始投票流程...");

    // 2. 创建者投票支持
    const vote1 = await sdk.approveProposal({
      feePayer: creator,
      member: creator,
      transactionIndex: proposalResult.transactionIndex,
    });
    console.log("✅ 创建者投票成功:", vote1);

    const vote2 = await sdk.approveProposal({
      feePayer: creator, // 由创建者支付手续费
      member: member2,
      transactionIndex: proposalResult.transactionIndex,
    });
    console.log("✅ 成员2投票成功:", vote2);

    // 3. 执行提案
    console.log("执行提案...");
    const executeSignature = await sdk.executeProposal({
      feePayer: creator,
      memberPublicKey: creator.publicKey,
      signers: [creator],
      transactionIndex: proposalResult.transactionIndex,
    });
    console.log("✅ 提案执行成功:", executeSignature);

    // 4. 获取提案详情
    console.log("获取提案详情...");
    const proposalDetail = await sdk.getProposalDetail(
      Number(proposalResult.transactionIndex)
    );

    if (proposalDetail) {
      console.log("✅ 提案详情:", {
        提案索引: proposalDetail.transactionIndex,
        状态: proposalDetail.status,
        投票情况: proposalDetail.approved,
        拒绝情况: proposalDetail.rejected,
      });
    } else {
      console.log("❌ 未找到提案详情");
    }

    // 5. 解析提案指令
    console.log("解析提案指令...");
    const parsedInstructions = await sdk.parseTransactionInstructions(
      Number(proposalResult.transactionIndex)
    );
    console.log("✅ 解析的指令:", {
      指令列表: parsedInstructions.map((ix) => ({
        索引: ix.index,
        程序ID: ix.programId,
        账户数量: ix.accounts.length,
        数据: ix.data,
      })),
    });

    console.log("\n🎉 Token-2022 mint 支持添加完成!");
  } catch (error) {
    console.error("❌ 创建支持 mint 关联账户提案失败:", error);
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
