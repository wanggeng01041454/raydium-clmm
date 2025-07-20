import fs, { read } from "fs";
import path from "path";
import os from "os";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as Token from '@solana/spl-token';
import * as SplTokenMetadata from '@solana/spl-token-metadata';

import * as NewToken2022 from '@solana-program/token-2022';
import * as Compat from '@solana/compat';
import * as NewInstructions from '@solana/instructions';

import { BuildType } from "../raw-sdk/baseTypes";
import { buildActionResult, BuildActionResultParams } from "../raw-sdk/utils";

/**
 * 读取 localnet-admin-keypair.json 为 Keypair
 * @param keyFilePath 
 * @returns 
 */
export async function readLocalNetAdminKeypair(): Promise<Keypair> {

  const keyFilePath = "../localnet-admin-keypair.json";
  const filePath = path.resolve(__dirname, keyFilePath);
  // console.log(`读取本地的 admin keypair: ${filePath}`);
  const data = fs.readFileSync(filePath, "utf-8");

  const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(data)));
  return keypair;
}

export async function readDefaultKeypair(): Promise<Keypair> {
  const keyFilePath = path.join(os.homedir(), '.config', 'solana', 'id.json');
  const filePath = path.resolve(keyFilePath);
  // console.log(`读取本地的 default keypair: ${filePath}`);

  const data = fs.readFileSync(filePath, "utf-8");
  const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(data)));
  return keypair;
}

export async function transferSol(params: {
  connection: Connection,
  fromKeypair: Keypair,
  toPublicKey: PublicKey,
  amount: number
}) {
  const transaction = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.transfer({
      fromPubkey: params.fromKeypair.publicKey,
      toPubkey: params.toPublicKey,
      lamports: params.amount * anchor.web3.LAMPORTS_PER_SOL, // 转账金额，单位为 SOL
    })
  );

  const signature = await anchor.web3.sendAndConfirmTransaction(
    params.connection,
    transaction,
    [params.fromKeypair],
    { commitment: 'confirmed' }
  );

  console.log(`Transfer ${params.amount} SOL from ${params.fromKeypair.publicKey.toBase58()} to ${params.toPublicKey.toBase58()} successful`);
}

export async function createMintAccount(params: {
  connection: Connection,
  payerKeypair: Keypair,
  authority: PublicKey,
  decimals: number,
  tokenProgram: PublicKey
}) {
  const mintAccountKeypair = Keypair.generate();

  await Token.createMint(
    params.connection,
    params.payerKeypair,
    params.authority,
    null,
    params.decimals,
    mintAccountKeypair,
    {
      commitment: 'confirmed',
    },
    params.tokenProgram
  );
  console.log(`create-mint-account success, mintAccountPubkey: ${mintAccountKeypair.publicKey.toBase58()}`);

  return mintAccountKeypair.publicKey;
}

export async function createMockXStockToken2022(params: {
  connection: Connection,
  payerKeypair: Keypair,
  authority: PublicKey,
  decimals: number,
}) {

  const mintAccountKeypair = Keypair.generate();

  const mintPubkey = mintAccountKeypair.publicKey;


  const extensions = [
    Token.ExtensionType.MetadataPointer,
    Token.ExtensionType.PermanentDelegate,
    Token.ExtensionType.DefaultAccountState,
    Token.ExtensionType.ScaledUiAmountConfig,
    Token.ExtensionType.PausableConfig,
    Token.ExtensionType.ConfidentialTransferMint,
    Token.ExtensionType.TransferHook,
  ];
  const mintLen = Token.getMintLen(extensions);

  // Token.ExtensionType.TokenMetadata 不用出现在上述数组中，另外计算

  const metadata: SplTokenMetadata.TokenMetadata = {
    mint: mintPubkey,
    name: 'NVIDIA xStock',
    symbol: 'NVDAx',
    uri: 'https://xstocks-metadata.backed.fi/tokens/Solana/NVDAx/metadata.json',
    additionalMetadata: [],
    updateAuthority: params.authority,
  };
  const metadataLen = Token.TYPE_SIZE + Token.LENGTH_SIZE + SplTokenMetadata.pack(metadata).length;


  const totalMintLen = mintLen + metadataLen;
  const lamports = await params.connection.getMinimumBalanceForRentExemption(totalMintLen);


  const ixs: TransactionInstruction[] = [];

  // 使用 systemProgram 创建 mint 账户
  ixs.push(
    SystemProgram.createAccount({
      fromPubkey: params.payerKeypair.publicKey,
      newAccountPubkey: mintPubkey,
      // 这里还必须用 mintLen, 而不是用 totalMintLen
      space: mintLen,
      lamports,
      programId: Token.TOKEN_2022_PROGRAM_ID,
    })
  );

  // 初始化 MetadataPointer 扩展
  // 必须在 初始化 mint 之前
  ixs.push(
    Token.createInitializeMetadataPointerInstruction(
      mintPubkey,
      params.authority,
      mintPubkey,
      Token.TOKEN_2022_PROGRAM_ID,
    )
  );

  // Token.ExtensionType.PermanentDelegate
  // 必须在 初始化 mint 之前
  ixs.push(
    Token.createInitializePermanentDelegateInstruction(
      mintPubkey,
      params.authority,
      Token.TOKEN_2022_PROGRAM_ID),
  );

  // Token.ExtensionType.DefaultAccountState,
  // 必须在 初始化 mint 之前
  ixs.push(
    Token.createInitializeDefaultAccountStateInstruction(
      mintPubkey,
      Token.AccountState.Initialized,
      Token.TOKEN_2022_PROGRAM_ID),
  );

  // Token.ExtensionType.ScaledUiAmountConfig
  // 必须在 初始化 mint 之前
  const multiplier = 1;
  ixs.push(
    Token.createInitializeScaledUiAmountConfigInstruction(
      mintPubkey,
      params.authority,
      multiplier,
      Token.TOKEN_2022_PROGRAM_ID,
    )
  );

  // Token.ExtensionType.PausableConfig
  // 必须在 初始化 mint 之前
  ixs.push(
    Token.createInitializePausableConfigInstruction(
      mintPubkey,
      params.authority,
      Token.TOKEN_2022_PROGRAM_ID
    )
  );

  // Token.ExtensionType.ConfidentialTransferMint
  // 必须在 初始化 mint 之前
  {
    // spl-token 库中没有对应的初始化指令，必须使用独立的  token-2022 库
    const ix = NewToken2022.getInitializeConfidentialTransferMintInstruction({
      mint: Compat.fromLegacyPublicKey(mintPubkey),
      authority: Compat.fromLegacyPublicKey(params.authority),
      autoApproveNewAccounts: false,
      auditorElgamalPubkey: null,
    });

    // 对 ix 进行序列化编码
    const legacyIx: TransactionInstruction = {
      programId: Token.TOKEN_2022_PROGRAM_ID,
      keys: ix.accounts.map(account => ({
        pubkey: new PublicKey(account.address.toString()),
        isSigner: NewInstructions.isSignerRole(account.role),
        isWritable: NewInstructions.isWritableRole(account.role),
      })),
      data: Buffer.from(ix.data),
    };

    ixs.push(legacyIx);
  }


  // Token.ExtensionType.TransferHook
  // 必须在 初始化 mint 之前
  ixs.push(
    Token.createInitializeTransferHookInstruction(
      mintPubkey,
      params.authority,
      // 使用 PublicKey.default 表示 null, 其它值会作为 programId; 
      PublicKey.default,
      Token.TOKEN_2022_PROGRAM_ID)
  );

  // 初始化 mint 账户
  ixs.push(
    Token.createInitializeMint2Instruction(
      mintPubkey,
      9,
      params.authority,
      null,
      Token.TOKEN_2022_PROGRAM_ID
    )
  );

  // 初始化 metadata； MetadataPointer 和 TokenMetadata 两个扩展
  // 这个必须放在 创建 mint 账户之后
  ixs.push(
    Token.createInitializeInstruction({
      programId: Token.TOKEN_2022_PROGRAM_ID,
      mint: mintPubkey,
      metadata: mintPubkey,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      mintAuthority: params.authority,
      updateAuthority: metadata.updateAuthority,
    })
  );

  const buildParams: BuildActionResultParams = {
    buildType: BuildType.SendAndConfirmTx,
    cuPrice: 10 ** 6,
    cuFactor: 1.4,

    connection: params.connection,
    ixs: ixs,
    payer: params.payerKeypair.publicKey,
    signers: [params.payerKeypair, mintAccountKeypair].filter(kp => kp !== undefined) as Keypair[],
  };

  const result = await buildActionResult(buildParams);
  console.log(`createMockXStockToken2022 success, result: ${result.toString()}`);

  console.log(`createMockXStockToken2022 success, mintPublicKey: ${mintPubkey.toBase58()}`);

  return mintPubkey;
}
