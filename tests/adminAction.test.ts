import { describe, expect, it, test } from "vitest"
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import * as anchor from "@coral-xyz/anchor";
import * as Token from '@solana/spl-token';
import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { createMintAccount, createMockXStockToken2022, readLocalNetAdminKeypair, transferSol } from "./utils";

import { ByrealClmmProvider } from "../raw-sdk/byrealClmmProvider";
import { CreateAmmConfigParams, CreatePoolParams, InitAdminGroupParams } from "../raw-sdk/byrealClmmTypes";
import { BuildType } from "../raw-sdk/baseTypes";


// 测试时使用的，全局的payer账户
const GlobalPayerKeypair = (anchor.AnchorProvider.env().wallet as NodeWallet).payer;

const clmmProvider = new ByrealClmmProvider(
  anchor.AnchorProvider.env().connection,
  "confirmed"
);


describe.sequential("ByrealClmm admin操作测试", async () => {
  const connection = anchor.AnchorProvider.env().connection;

  // 读取本地的 admin keypair
  const adminKeyPair = await readLocalNetAdminKeypair();

  // 为admin转账
  await transferSol({
    connection,
    fromKeypair: GlobalPayerKeypair,
    toPublicKey: adminKeyPair.publicKey,
    amount: 10
  });

  it("初始化 AdminGroup", async () => {

    const initAdminGroupParams: InitAdminGroupParams = {
      superAdmin: adminKeyPair.publicKey,
      superAdminKeypair: adminKeyPair,

      feeKeeper: adminKeyPair.publicKey,
      rewardConfigManager: adminKeyPair.publicKey,
      rewardClaimManager: adminKeyPair.publicKey,
      poolManager: adminKeyPair.publicKey,
      emergencyManager: adminKeyPair.publicKey,
      normalManager: adminKeyPair.publicKey,

      buildType: BuildType.SendAndConfirmTx,
    };

    const result = await clmmProvider.initAdminGroupAction(initAdminGroupParams);
    console.log("初始化 AdminGroup 结果:", result.toString());


    const adminGroupAddress = clmmProvider.findAmmAdminGroupAddress();
    const adminGroupAccountData = await clmmProvider.getAdminGroupAccount(adminGroupAddress);

    expect(adminGroupAccountData.feeKeeper.toBase58()).toBe(adminKeyPair.publicKey.toBase58());
    expect(adminGroupAccountData.rewardConfigManager.toBase58()).toBe(adminKeyPair.publicKey.toBase58());
    expect(adminGroupAccountData.rewardClaimManager.toBase58()).toBe(adminKeyPair.publicKey.toBase58());
    expect(adminGroupAccountData.poolManager.toBase58()).toBe(adminKeyPair.publicKey.toBase58());
    expect(adminGroupAccountData.emergencyManager.toBase58()).toBe(adminKeyPair.publicKey.toBase58());
    expect(adminGroupAccountData.normalManager.toBase58()).toBe(adminKeyPair.publicKey.toBase58());
  })

  const ammConfigIndex = 1;
  it("创建 ammConfig", async () => {
    const createAmmConfigParams: CreateAmmConfigParams = {
      owner: adminKeyPair.publicKey,
      ownerKeypair: adminKeyPair,

      index: ammConfigIndex,
      tickSpacing: 64,
      tradeFeeRate: 0.0005,
      protocolFeeRate: 0.0001,
      fundFeeRate: 0.0001,

      buildType: BuildType.SendAndConfirmTx,
    };

    const result = await clmmProvider.createAmmConfigAction(createAmmConfigParams);
    console.log("创建 ammConfig 结果:", result.toString());

    const ammConfigAddress = clmmProvider.findAmmConfigAddress(ammConfigIndex);
    const ammConfigAccountData = await clmmProvider.getAmmConfigAccount(ammConfigAddress);
    expect(ammConfigAccountData.index).toBe(ammConfigIndex);
    expect(ammConfigAccountData.tickSpacing).toBe(64);
  })

  // it("sqrtPriceX64 转换", () => {

  //   {
  //     const price = 1.0; // 价格
  //     const decimalsA = 6; // token A 的小数位
  //     const decimalsB = 6; // token B 的小数位

  //     const sqrtPriceX64 = clmmProvider.price2SqrtPriceX64(price, decimalsA, decimalsB);
  //     console.log("sqrtPriceX64:", sqrtPriceX64.toString());

  //     expect(sqrtPriceX64.toString()).toBe("18446744073709551616"); // 1.0 的 sqrtPriceX64
  //   }

  // })

  it("创建 Pool, token 和 token", async () => {

    let tokenAProgramId = Token.TOKEN_PROGRAM_ID;
    let mintA = await createMintAccount({
      connection,
      payerKeypair: GlobalPayerKeypair,
      authority: GlobalPayerKeypair.publicKey,
      decimals: 6,
      tokenProgram: tokenAProgramId
    });

    let tokenBProgramId = Token.TOKEN_PROGRAM_ID;
    let mintB = await createMintAccount({
      connection,
      payerKeypair: GlobalPayerKeypair,
      authority: GlobalPayerKeypair.publicKey,
      decimals: 6,
      tokenProgram: tokenBProgramId
    });

    // sort mintA 和 mintB
    if (mintA > mintB) {
      [mintA, mintB] = [mintB, mintA];
      [tokenAProgramId, tokenBProgramId] = [tokenBProgramId, tokenAProgramId];
    }

    const sqrtPriceX64 = clmmProvider.price2SqrtPriceX64(1.0, 6, 6);
    console.log(`sqrtPriceX64: ${sqrtPriceX64.toString()}`);

    const createPoolParams: CreatePoolParams = {
      poolCreator: adminKeyPair.publicKey,
      poolCreatorKeypair: adminKeyPair,

      poolManager: adminKeyPair.publicKey,
      poolManagerKeypair: adminKeyPair,

      ammConfigId: clmmProvider.findAmmConfigAddress(ammConfigIndex),

      mintA,
      mintAProgramId: tokenAProgramId,

      mintB,
      mintBProgramId: tokenBProgramId,

      sqrtPriceX64,

      buildType: BuildType.SendAndConfirmTx,
    };

    const result = await clmmProvider.createPoolAction(createPoolParams);
    console.log("创建 Pool 结果:", result.toString());
  });

  const navadiaToken2022Mint = new PublicKey("Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh");
  const myMockXNavidaToken2022Mint = await createMockXStockToken2022({
    connection,
    payerKeypair: GlobalPayerKeypair,
    authority: GlobalPayerKeypair.publicKey,
    decimals: 6,
  });

  it("创建 support mint 的 associated token account", async () => {
    {
      const result = await clmmProvider.createSupportMintAssociatedAction({
        owner: adminKeyPair.publicKey,
        ownerKeypair: adminKeyPair,
        tokenMint: navadiaToken2022Mint,

        buildType: BuildType.SendAndConfirmTx,
      });
      console.log("创建 support mint 的 associated token account 结果:", result.toString());

      const supportMintAssociatedAddress = clmmProvider.findSupportMintAssociatedAccountAddress(navadiaToken2022Mint);
      const supportMintAssociatedAccountData = await clmmProvider.getSupportMintAssociatedAccount(supportMintAssociatedAddress);
      expect(supportMintAssociatedAccountData.mint.toBase58()).toBe(navadiaToken2022Mint.toBase58());
    }

    {
      const result = await clmmProvider.createSupportMintAssociatedAction({
        owner: adminKeyPair.publicKey,
        ownerKeypair: adminKeyPair,
        tokenMint: myMockXNavidaToken2022Mint,

        buildType: BuildType.SendAndConfirmTx,
      });
      console.log("创建 support mint 的 associated token account 结果:", result.toString());

      const supportMintAssociatedAddress = clmmProvider.findSupportMintAssociatedAccountAddress(myMockXNavidaToken2022Mint);
      const supportMintAssociatedAccountData = await clmmProvider.getSupportMintAssociatedAccount(supportMintAssociatedAddress);
      expect(supportMintAssociatedAccountData.mint.toBase58()).toBe(myMockXNavidaToken2022Mint.toBase58());
    }

  });

  it("创建 Pool, token 和 xNavida(token2022)", async () => {

    let tokenAProgramId = Token.TOKEN_PROGRAM_ID;
    let mintA = await createMintAccount({
      connection,
      payerKeypair: GlobalPayerKeypair,
      authority: GlobalPayerKeypair.publicKey,
      decimals: 6,
      tokenProgram: tokenAProgramId
    });

    let tokenBProgramId = Token.TOKEN_2022_PROGRAM_ID;
    let mintB = navadiaToken2022Mint; // xStock, navida

    // sort mintA 和 mintB
    if (clmmProvider.comparePublicKeys(mintA, mintB) > 0) {
      [mintA, mintB] = [mintB, mintA];
      [tokenAProgramId, tokenBProgramId] = [tokenBProgramId, tokenAProgramId];
    }

    console.log(`=============tokenAProgramId: ${tokenAProgramId.toBase58()}, mintA: ${mintA.toBase58()}`);
    console.log(`+++++++++++++tokenBProgramId: ${tokenBProgramId.toBase58()}, mintB: ${mintB.toBase58()}`);

    const sqrtPriceX64 = clmmProvider.price2SqrtPriceX64(1.0, 6, 6);
    const supportMintAssociatedAddress = clmmProvider.findSupportMintAssociatedAccountAddress(navadiaToken2022Mint);

    const createPoolParams: CreatePoolParams = {
      poolCreator: adminKeyPair.publicKey,
      poolCreatorKeypair: adminKeyPair,

      poolManager: adminKeyPair.publicKey,
      poolManagerKeypair: adminKeyPair,

      ammConfigId: clmmProvider.findAmmConfigAddress(ammConfigIndex),

      mintA,
      mintAProgramId: tokenAProgramId,

      mintB,
      mintBProgramId: tokenBProgramId,

      sqrtPriceX64,

      remainAccounts: [supportMintAssociatedAddress],

      buildType: BuildType.SendAndConfirmTx,
    };

    const result = await clmmProvider.createPoolAction(createPoolParams);
    console.log("创建 Pool 结果:", result.toString());
  });

  it("创建 Pool, token 和 自建的token2022(对标xNavida)", async () => {

    let tokenAProgramId = Token.TOKEN_PROGRAM_ID;
    let mintA = await createMintAccount({
      connection,
      payerKeypair: GlobalPayerKeypair,
      authority: GlobalPayerKeypair.publicKey,
      decimals: 6,
      tokenProgram: tokenAProgramId
    });

    let tokenBProgramId = Token.TOKEN_2022_PROGRAM_ID;
    let mintB = myMockXNavidaToken2022Mint; // 自建的 xStock, navida

    // sort mintA 和 mintB
    if (clmmProvider.comparePublicKeys(mintA, mintB) > 0) {
      [mintA, mintB] = [mintB, mintA];
      [tokenAProgramId, tokenBProgramId] = [tokenBProgramId, tokenAProgramId];
    }

    console.log(`=============tokenAProgramId: ${tokenAProgramId.toBase58()}, mintA: ${mintA.toBase58()}`);
    console.log(`+++++++++++++tokenBProgramId: ${tokenBProgramId.toBase58()}, mintB: ${mintB.toBase58()}`);

    const sqrtPriceX64 = clmmProvider.price2SqrtPriceX64(1.0, 6, 6);
    const supportMintAssociatedAddress = clmmProvider.findSupportMintAssociatedAccountAddress(myMockXNavidaToken2022Mint);

    const createPoolParams: CreatePoolParams = {
      poolCreator: adminKeyPair.publicKey,
      poolCreatorKeypair: adminKeyPair,

      poolManager: adminKeyPair.publicKey,
      poolManagerKeypair: adminKeyPair,

      ammConfigId: clmmProvider.findAmmConfigAddress(ammConfigIndex),

      mintA,
      mintAProgramId: tokenAProgramId,

      mintB,
      mintBProgramId: tokenBProgramId,

      sqrtPriceX64,

      remainAccounts: [supportMintAssociatedAddress],

      buildType: BuildType.SendAndConfirmTx,
    };

    const result = await clmmProvider.createPoolAction(createPoolParams);
    console.log("创建 Pool 结果:", result.toString());
  });
})




