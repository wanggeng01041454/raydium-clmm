import {
  PublicKey,
  TransactionMessage,
  TransactionInstruction,
  ComputeBudgetProgram,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";
import bs58 from "bs58";

/**
 * @description 工具函数：将数字数组转换为十六进制字符串
 *
 * @param bytes 数字数组
 * @returns 十六进制字符串
 */
export function bytesToHexString(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * @description 将交易序列化为 Base58 字符串
 *
 * @param connection 连接
 * @param payerPublicKey 支付者公钥
 * @param instructions 交易指令
 * @returns Base58 字符串
 */
export async function serializeToBase58(
  connection: Connection,
  payerPublicKey: PublicKey,
  instructions: TransactionInstruction[]
) {
  const transactionMessage = new TransactionMessage({
    payerKey: payerPublicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [
      ...instructions,
      // ComputeBudgetProgram.setComputeUnitLimit({
      //   units: 400000,
      // }),
      // ComputeBudgetProgram.setComputeUnitPrice({
      //   microLamports: 50000,
      // }),
    ],
  });

  const message = transactionMessage.compileToV0Message();

  const transaction = new VersionedTransaction(message);

  return bs58.encode(transaction.serialize());
}

export * from "./constants";
export * from "./sendTransaction";
