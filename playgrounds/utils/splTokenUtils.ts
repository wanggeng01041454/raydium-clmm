import { createMint, createAccount, mintTo } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import { connection } from "../config";

/**
 * 创建一个新的SPL代币铸造账户
 *
 * @param payer 支付交易费用的密钥对
 * @returns 返回新创建的代币铸造账户的公钥
 */
async function createMintToken(payer: Keypair, tokenKeyPair?: Keypair) {
  const inputMint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    6,
    tokenKeyPair
  );

  return inputMint;
}

/**
 * 为指定的代币铸造账户创建一个关联账户
 *
 * @param payer 支付交易费用的密钥对
 * @param mint 代币铸造账户的公钥
 * @returns 返回新创建的关联账户的公钥
 */
async function createAccountToken(
  payer: Keypair,
  owner: PublicKey,
  mint: PublicKey
) {
  const account = await createAccount(connection, payer, mint, owner);

  return account;
}

/**
 * 铸造指定数量的代币到目标账户
 * @param payer 支付交易费用的密钥对
 * @param target 接收代币的目标账户
 * @param mint 代币铸造账户的公钥
 * @param amount 要铸造的代币数量
 * @returns 返回交易签名
 */
async function mintToken(
  payer: Keypair,
  target: PublicKey,
  mint: PublicKey,
  amount: number
) {
  const tx = await mintTo(
    connection,
    payer,
    mint,
    target,
    payer.publicKey,
    amount
  );

  return tx;
}

export { createMintToken, createAccountToken, mintToken };
