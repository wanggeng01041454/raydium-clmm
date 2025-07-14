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
import { createAccountToken, mintToken } from "../utils/splTokenUtils.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { BN } from "bn.js";
import { PublicKey } from "@solana/web3.js";

const creator = wallet;
const member2 = wallet2;
const member3 = wallet3;

async function main() {
  const [multisigPda] = MultisigUtils.getMultisigPda(createKey.publicKey);
  const sdk = new MultisigSDK({ connection, multisigPda });
  const VAULT_INDEX = 1;

  const rewardConfigManager = sdk.getVaultPda(VAULT_INDEX);

  try {
    const depositAmount = 10 * 10 ** 6;

    const { publicKey: ammConfigId } = getPdaAmmConfigId(
      ProgramAddress,
      AMM_CONFIG.configIndex
    );

    // DGD3tUst1NGVbnPhUomYfdrdc3YmFpcTnRFidPMxkyFD
    const poolId = getPdaPoolId(
      ProgramAddress,
      ammConfigId,
      token0Mint,
      token1Mint
    ).publicKey.toBase58();

    // 检查 receiverTokenAccount 是否存在，不存在则创建
    let receiverTokenAccount: PublicKey;

    try {
      console.log("rewardConfigManager ===>", rewardConfigManager.toString());
      // 获取关联代币账户地址
      const associatedTokenAddress = await getAssociatedTokenAddress(
        token0Mint,
        wallet.publicKey
      );
      console.log(
        "associatedTokenAddress ===>",
        associatedTokenAddress.toString()
      );

      // 尝试获取账户信息，如果账户存在则使用现有账户
      await getAccount(connection, associatedTokenAddress);
      receiverTokenAccount = associatedTokenAddress;
      console.log(
        "使用现有的 receiverTokenAccount:",
        receiverTokenAccount.toString()
      );
    } catch (error) {
      // 账户不存在，创建新账户
      console.log("receiverTokenAccount 不存在，正在创建新账户...");
      receiverTokenAccount = await createAccountToken(
        wallet,
        wallet.publicKey,
        token0Mint
      );
      console.log(
        "成功创建 receiverTokenAccount:",
        receiverTokenAccount.toString()
      );

      await mintToken(
        wallet,
        receiverTokenAccount,
        token0Mint,
        depositAmount * 2
      );
    }

    const instruction = await BaseInstruction.withdrawOffchainRewardInstruction(
      new PublicKey(poolId),
      rewardConfigManager, // authority (需要是 reward_config_manager)
      token0Mint, // tokenMint
      receiverTokenAccount, // receiverTokenAccount
      TOKEN_PROGRAM_ID, // tokenProgram
      new BN(depositAmount) // amount
    );

    const proposalResult = await sdk.createProposal({
      feePayer: creator,
      creator,
      instructions: [instruction],
      vaultIndex: VAULT_INDEX,
      memo: "提取剩余 offchain 奖励",
    });

    console.log("✅ 提取剩余 offchain 奖励提案创建成功:", proposalResult);

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
    console.error("❌ 提取剩余 offchain 奖励提案失败:", error);
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
