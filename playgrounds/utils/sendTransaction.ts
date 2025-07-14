import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

export async function sendTransaction(
  connection: Connection,
  payer: Keypair | Keypair[],
  instructions: TransactionInstruction[]
) {
  let firstPayer: Keypair;
  let remainingPayers: Keypair[] = [];
  if (Array.isArray(payer)) {
    firstPayer = payer[0];
    remainingPayers = payer.slice(1);
  } else {
    firstPayer = payer;
  }

  const transactionMessage = new TransactionMessage({
    payerKey: firstPayer.publicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [
      ...instructions,
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 400000,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000,
      }),
    ],
  });

  const transaction = new VersionedTransaction(
    transactionMessage.compileToV0Message()
  );

  transaction.sign([firstPayer, ...remainingPayers]);

  const txHash = await connection.sendTransaction(transaction, {
    // skipPreflight: true,
  });

  console.log("txHash", txHash);

  const tx = await connection.confirmTransaction(txHash);

  console.log("confirm tx", tx);
}

/**
 * 模拟交易执行，不实际发送到链上
 * @param payer 支付者密钥对，可以是单个或数组
 * @param instructions 交易指令数组
 * @returns 模拟交易的结果
 */
export async function simulateTransaction(
  connection: Connection,
  payer: Keypair | Keypair[],
  instructions: TransactionInstruction[]
) {
  let firstPayer: Keypair;
  let remainingPayers: Keypair[] = [];
  if (Array.isArray(payer)) {
    firstPayer = payer[0];
    remainingPayers = payer.slice(1);
  } else {
    firstPayer = payer;
  }

  const transactionMessage = new TransactionMessage({
    payerKey: firstPayer.publicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [
      ...instructions,
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 400000,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 50000,
      }),
    ],
  });

  const transaction = new VersionedTransaction(
    transactionMessage.compileToV0Message()
  );

  // 签名交易（模拟也需要签名）
  transaction.sign([firstPayer, ...remainingPayers]);

  // 模拟交易
  const simulationResult = await connection.simulateTransaction(transaction, {
    sigVerify: false, // 跳过签名验证以提高性能
    commitment: "processed",
  });

  console.log("模拟交易结果:", {
    成功: !simulationResult.value.err,
    错误: simulationResult.value.err,
    消耗的计算单元: simulationResult.value.unitsConsumed,
    日志: simulationResult.value.logs,
  });

  // 如果模拟失败，抛出错误信息
  if (simulationResult.value.err) {
    console.error("❌ 模拟交易失败:", simulationResult.value.err);
    console.error("📄 详细日志:", simulationResult.value.logs);
    throw new Error(
      `模拟交易失败: ${JSON.stringify(simulationResult.value.err)}`
    );
  }

  console.log("✅ 模拟交易成功!");
  return simulationResult;
}
