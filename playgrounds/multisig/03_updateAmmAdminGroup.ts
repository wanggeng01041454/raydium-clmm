import { MultisigSDK, MultisigUtils } from "./sdk.js";

import { connection, wallet, wallet2, wallet3 } from "../config/index.js";
import { createKey } from "./config.js";
import { BaseInstruction } from "../sdk/baseInstruction.js";

const creator = wallet;
const member2 = wallet2;
const member3 = wallet3;

async function main() {
  const [multisigPda] = MultisigUtils.getMultisigPda(createKey.publicKey);
  const sdk = new MultisigSDK({ connection, multisigPda });

  try {
    // 1. 更新 AMM 管理员组，使用 getVaultPda(1) 作为管理员
    const feeKeeper = sdk.getVaultPda(1);
    const rewardConfigManager = sdk.getVaultPda(1);
    const rewardClaimManager = sdk.getVaultPda(1);
    const poolManager = sdk.getVaultPda(1);
    const emergencyManager = sdk.getVaultPda(1);
    const normalManager = sdk.getVaultPda(1);

    const instruction = await BaseInstruction.updateAmmAdminGroupInstruction({
      feeKeeper,
      rewardConfigManager,
      rewardClaimManager,
      poolManager,
      emergencyManager,
      normalManager,
    });

    const proposalResult = await sdk.createProposal({
      feePayer: creator,
      creator,
      instructions: [instruction],
      memo: "初始化 AMM 管理员组",
    });

    console.log("✅ 自定义指令提案创建成功:", proposalResult);

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
  } catch (error) {
    console.error("❌ 自定义指令提案失败:", error);
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
