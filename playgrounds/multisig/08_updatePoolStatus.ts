import { MultisigSDK, MultisigUtils } from "./sdk.js";

import {
  AMM_CONFIG,
  connection,
  token0Mint,
  token1Mint,
  wallet,
  wallet2,
  wallet3,
} from "../config/index.js";
import { createKey } from "./config.js";
import { BaseInstruction } from "../sdk/baseInstruction.js";
import { ProgramAddress } from "../utils/constants.js";
import { getPdaAmmConfigId, getPdaPoolId } from "../utils/pda.js";
import { PublicKey } from "@solana/web3.js";

const creator = wallet;
const member2 = wallet2;
const member3 = wallet3;

async function main() {
  const [multisigPda] = MultisigUtils.getMultisigPda(createKey.publicKey);
  const sdk = new MultisigSDK({ connection, multisigPda });
  const VAULT_INDEX = 1;

  const emergencyManager = sdk.getVaultPda(VAULT_INDEX);

  try {
    const { publicKey: ammConfigId } = getPdaAmmConfigId(
      ProgramAddress,
      AMM_CONFIG.configIndex
    );

    const poolId = getPdaPoolId(
      ProgramAddress,
      ammConfigId,
      token0Mint,
      token1Mint
    ).publicKey.toBase58();

    console.log("poolId ===>", poolId);

    /**
     * 池状态的位标志表示法 (Bitwise representation of the pool state)
     *
     * 常用状态值示例：
     * - 0 (二进制: 00000): 所有功能正常
     * - 1 (二进制: 00001): 只禁用开仓/增流，其他正常
     * - 2 (二进制: 00010): 只禁用减流，其他正常
     * - 16 (二进制: 10000): 只禁用交换，其他正常
     * - 31 (二进制: 11111): 禁用所有功能（紧急停止）
     */
    const newStatus = 1;

    const instruction = await BaseInstruction.updatePoolStatusInstruction(
      emergencyManager, // authority (emergency_manager)
      new PublicKey(poolId),
      newStatus
    );

    const proposalResult = await sdk.createProposal({
      feePayer: creator,
      creator,
      instructions: [instruction],
      vaultIndex: VAULT_INDEX,
      memo: `更新池状态为: ${newStatus}`,
    });

    console.log("✅ 更新池状态提案创建成功:", proposalResult);

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

    console.log("\n🎉 池状态更新完成!");
  } catch (error) {
    console.error("❌ 更新池状态提案失败:", error);
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
