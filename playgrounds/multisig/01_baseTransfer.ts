import { MultisigSDK, MultisigUtils } from "./sdk.js";
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { connection, wallet, wallet2, wallet3 } from "../config/index.js";
import { createKey } from "./config.js";

const creator = wallet;
const member2 = wallet2;
const member3 = wallet3;

async function main() {
  // 2. 生成多重签名 PDA
  const [multisigPda] = MultisigUtils.getMultisigPda(createKey.publicKey);
  console.log("多重签名 PDA:", multisigPda.toBase58());

  // 3. 初始化 SDK
  const sdk = new MultisigSDK({
    connection,
    multisigPda,
  });

  try {
    // 1. 创建提案 - 转账示例
    console.log("创建转账提案...");
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: sdk.getVaultPda(),
      toPubkey: creator.publicKey,
      lamports: 1 * LAMPORTS_PER_SOL,
    });

    const proposalResult = await sdk.createProposal({
      feePayer: creator,
      creator,
      instructions: [transferInstruction],
      memo: "转账 1 SOL 给创建者",
    });
    console.log("✅ 提案创建成功:", {
      交易索引: proposalResult.transactionIndex.toString(),
      Vault交易签名: proposalResult.vaultTransactionSignature,
      提案创建签名: proposalResult.proposalCreateSignature,
    });

    // 2. 投票支持提案
    console.log("投票支持提案...");
    const vote1 = await sdk.approveProposal({
      feePayer: creator,
      member: creator,
      transactionIndex: proposalResult.transactionIndex,
    });
    console.log("✅ 创建者投票成功:", vote1);

    const vote2 = await sdk.approveProposal({
      feePayer: creator,
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

    // 4. 查询所有提案
    console.log("查询所有提案...");
    const proposals = await sdk.getProposals();
    console.log("✅ 提案列表:", proposals);

    // 5. 查询特定提案详情
    console.log("查询提案详情...");
    const proposalDetail = await sdk.getProposalDetail(
      Number(proposalResult.transactionIndex)
    );
    console.log("✅ 提案详情:", proposalDetail);

    // 6. 解析提案中的指令
    console.log("解析提案指令...");
    const parsedInstructions = await sdk.parseTransactionInstructions(
      Number(proposalResult.transactionIndex)
    );

    console.log("✅ 解析的指令:", {
      指令列表: parsedInstructions.map((ix) => ({
        索引: ix.index,
        程序ID: ix.programId,
        账户数量: ix.accounts.length,
        账户详情: ix.accounts,
        数据: ix.data,
      })),
    });
  } catch (error) {
    console.error("❌ 操作失败:", error);
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
