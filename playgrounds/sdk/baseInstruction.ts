import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, TransactionInstruction, Connection } from "@solana/web3.js";
import BN from "bn.js";
import { connection } from "../config";

// import ByrealClmmIDL from "../../target/idl/byreal_clmm_mainnet.json";
import ByrealClmmIDL from "../../target/idl/byreal_clmm.json";
import { ByrealClmm } from "../../target/types/byreal_clmm";

export const getAmmV3Program = (): Program<ByrealClmm> => {
  // 创建一个包含 publicKey 的钱包对象
  const dummyWallet = {
    publicKey: new PublicKey("11111111111111111111111111111112"), // 使用系统程序 ID 作为默认值
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };

  const provider = new anchor.AnchorProvider(
    // new Connection("https://api.mainnet-beta.solana.com", "confirmed"),
    connection,
    dummyWallet,
    { commitment: "confirmed" }
  );

  return new Program<ByrealClmm>(ByrealClmmIDL as any, provider);
};

export class BaseInstruction {
  static async createPoolInstruction(
    poolCreator: PublicKey,
    poolManager: PublicKey,
    ammConfigId: PublicKey,
    mintA: PublicKey,
    mintProgramIdA: PublicKey,
    mintB: PublicKey,
    mintProgramIdB: PublicKey,
    sqrtPriceX64: BN,
    openTime?: BN,
    extendMintAccount?: PublicKey[]
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const _openTime = openTime || new BN(0);

    const instruction = program.methods
      .createPool(sqrtPriceX64, _openTime)
      .accounts({
        poolCreator,
        poolManager,
        ammConfig: ammConfigId,
        tokenMint0: mintA,
        tokenMint1: mintB,
        tokenProgram0: mintProgramIdA,
        tokenProgram1: mintProgramIdB,
      });

    // 如果有额外的 mint accounts，添加为 remaining accounts
    if (extendMintAccount && extendMintAccount.length > 0) {
      instruction.remainingAccounts(
        extendMintAccount.map((k) => ({
          pubkey: k,
          isSigner: false,
          isWritable: false,
        }))
      );
    }

    return await instruction.instruction();
  }

  static async openPositionFromLiquidityInstruction(
    payer: PublicKey,
    poolId: PublicKey,
    positionNftOwner: PublicKey,
    positionNftMint: PublicKey,
    positionNftAccount: PublicKey,
    metadataAccount: PublicKey,
    protocolPosition: PublicKey,
    tickArrayLower: PublicKey,
    tickArrayUpper: PublicKey,
    personalPosition: PublicKey,
    ownerTokenAccountA: PublicKey,
    ownerTokenAccountB: PublicKey,
    tokenVaultA: PublicKey,
    tokenVaultB: PublicKey,
    tokenMintA: PublicKey,
    tokenMintB: PublicKey,

    tickLowerIndex: number,
    tickUpperIndex: number,
    tickArrayLowerStartIndex: number,
    tickArrayUpperStartIndex: number,
    liquidity: BN,
    amountMaxA: BN,
    amountMaxB: BN,
    withMetadata: "create" | "no-create",

    exTickArrayBitmap?: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .openPositionV2(
        tickLowerIndex,
        tickUpperIndex,
        tickArrayLowerStartIndex,
        tickArrayUpperStartIndex,
        liquidity,
        amountMaxA,
        amountMaxB,
        withMetadata === "create",
        null // baseFlag 设为 null，因为这是基于流动性的
      )
      .accountsPartial({
        payer,
        positionNftOwner,
        positionNftMint,
        positionNftAccount,
        metadataAccount,
        poolState: poolId,
        protocolPosition,
        tickArrayLower,
        tickArrayUpper,
        personalPosition,
        tokenAccount0: ownerTokenAccountA,
        tokenAccount1: ownerTokenAccountB,
        tokenVault0: tokenVaultA,
        tokenVault1: tokenVaultB,
        vault0Mint: tokenMintA,
        vault1Mint: tokenMintB,
      });

    // 如果有额外的 tick array bitmap，添加为 remaining accounts
    if (exTickArrayBitmap) {
      instruction.remainingAccounts([
        { pubkey: exTickArrayBitmap, isSigner: false, isWritable: true },
      ]);
    }

    return await instruction.instruction();
  }

  static async openPositionFromLiquidityInstruction22(
    payer: PublicKey,
    poolId: PublicKey,
    positionNftOwner: PublicKey,
    positionNftMint: PublicKey,
    positionNftAccount: PublicKey,
    protocolPosition: PublicKey,
    tickArrayLower: PublicKey,
    tickArrayUpper: PublicKey,
    personalPosition: PublicKey,
    ownerTokenAccountA: PublicKey,
    ownerTokenAccountB: PublicKey,
    tokenVaultA: PublicKey,
    tokenVaultB: PublicKey,
    tokenMintA: PublicKey,
    tokenMintB: PublicKey,

    tickLowerIndex: number,
    tickUpperIndex: number,
    tickArrayLowerStartIndex: number,
    tickArrayUpperStartIndex: number,
    liquidity: BN,
    amountMaxA: BN,
    amountMaxB: BN,
    withMetadata: "create" | "no-create",

    exTickArrayBitmap?: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .openPositionWithToken22Nft(
        tickLowerIndex,
        tickUpperIndex,
        tickArrayLowerStartIndex,
        tickArrayUpperStartIndex,
        liquidity,
        amountMaxA,
        amountMaxB,
        withMetadata === "create",
        null
      )
      .accountsPartial({
        payer,
        positionNftOwner,
        positionNftMint,
        positionNftAccount,
        poolState: poolId,
        // 这边需要手动传入生成的 PDA 账号，因为 anchor 自动生成用的是小端序，而 raydium 的合约用的是大端序 (tick_lower_index.to_be_bytes())，使用 anchor 自动生成的会出错；
        protocolPosition,
        tickArrayLower,
        tickArrayUpper,
        personalPosition,

        tokenAccount0: ownerTokenAccountA,
        tokenAccount1: ownerTokenAccountB,
        tokenVault0: tokenVaultA,
        tokenVault1: tokenVaultB,
        vault0Mint: tokenMintA,
        vault1Mint: tokenMintB,
      });

    // 如果有额外的 tick array bitmap，添加为 remaining accounts
    if (exTickArrayBitmap) {
      instruction.remainingAccounts([
        { pubkey: exTickArrayBitmap, isSigner: false, isWritable: true },
      ]);
    }

    return await instruction.instruction();
  }

  static async openPositionFromBaseInstruction(
    payer: PublicKey,
    poolId: PublicKey,
    positionNftOwner: PublicKey,
    positionNftMint: PublicKey,
    positionNftAccount: PublicKey,
    metadataAccount: PublicKey,
    protocolPosition: PublicKey,
    tickArrayLower: PublicKey,
    tickArrayUpper: PublicKey,
    personalPosition: PublicKey,
    ownerTokenAccountA: PublicKey,
    ownerTokenAccountB: PublicKey,
    tokenVaultA: PublicKey,
    tokenVaultB: PublicKey,
    tokenMintA: PublicKey,
    tokenMintB: PublicKey,

    tickLowerIndex: number,
    tickUpperIndex: number,
    tickArrayLowerStartIndex: number,
    tickArrayUpperStartIndex: number,

    withMetadata: "create" | "no-create",
    base: "MintA" | "MintB",
    baseAmount: BN,
    otherAmountMax: BN,

    exTickArrayBitmap?: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .openPositionV2(
        tickLowerIndex,
        tickUpperIndex,
        tickArrayLowerStartIndex,
        tickArrayUpperStartIndex,
        new BN(0), // liquidity 设为 0，因为是基于 base amount
        base === "MintA" ? baseAmount : otherAmountMax, // amount0Max
        base === "MintA" ? otherAmountMax : baseAmount, // amount1Max
        withMetadata === "create",
        base === "MintA" // baseFlag
      )
      .accountsPartial({
        payer,
        positionNftOwner,
        positionNftMint,
        positionNftAccount,
        metadataAccount,
        poolState: poolId,
        protocolPosition,
        tickArrayLower,
        tickArrayUpper,
        personalPosition,
        tokenAccount0: ownerTokenAccountA,
        tokenAccount1: ownerTokenAccountB,
        tokenVault0: tokenVaultA,
        tokenVault1: tokenVaultB,
        vault0Mint: tokenMintA,
        vault1Mint: tokenMintB,
      });

    // 如果有额外的 tick array bitmap，添加为 remaining accounts
    if (exTickArrayBitmap) {
      instruction.remainingAccounts([
        { pubkey: exTickArrayBitmap, isSigner: false, isWritable: true },
      ]);
    }

    return await instruction.instruction();
  }

  static async openPositionFromBaseInstruction22(
    payer: PublicKey,
    poolId: PublicKey,
    positionNftOwner: PublicKey,
    positionNftMint: PublicKey,
    positionNftAccount: PublicKey,
    protocolPosition: PublicKey,
    tickArrayLower: PublicKey,
    tickArrayUpper: PublicKey,
    personalPosition: PublicKey,
    ownerTokenAccountA: PublicKey,
    ownerTokenAccountB: PublicKey,
    tokenVaultA: PublicKey,
    tokenVaultB: PublicKey,
    tokenMintA: PublicKey,
    tokenMintB: PublicKey,

    tickLowerIndex: number,
    tickUpperIndex: number,
    tickArrayLowerStartIndex: number,
    tickArrayUpperStartIndex: number,

    withMetadata: "create" | "no-create",
    base: "MintA" | "MintB",
    baseAmount: BN,
    otherAmountMax: BN,

    exTickArrayBitmap?: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .openPositionWithToken22Nft(
        tickLowerIndex,
        tickUpperIndex,
        tickArrayLowerStartIndex,
        tickArrayUpperStartIndex,
        new BN(0), // liquidity 设为 0，因为是基于 base amount
        base === "MintA" ? baseAmount : otherAmountMax, // amountMaxA
        base === "MintA" ? otherAmountMax : baseAmount, // amountMaxB
        withMetadata === "create",
        base === "MintA" // baseFlag
      )
      .accountsPartial({
        payer,
        positionNftOwner,
        positionNftMint,
        positionNftAccount,
        poolState: poolId,
        // 这边需要手动传入生成的 PDA 账号，因为 anchor 自动生成用的是小端序；而 raydium 的合约用的是大端序 (tick_lower_index.to_be_bytes())
        protocolPosition,
        tickArrayLower,
        tickArrayUpper,
        personalPosition,

        tokenAccount0: ownerTokenAccountA,
        tokenAccount1: ownerTokenAccountB,
        tokenVault0: tokenVaultA,
        tokenVault1: tokenVaultB,
        vault0Mint: tokenMintA,
        vault1Mint: tokenMintB,
      });

    // 如果有额外的 tick array bitmap，添加为 remaining accounts
    if (exTickArrayBitmap) {
      instruction.remainingAccounts([
        { pubkey: exTickArrayBitmap, isSigner: false, isWritable: true },
      ]);
    }

    return await instruction.instruction();
  }

  static async closePositionInstruction(
    positionNftOwner: PublicKey,
    positionNftMint: PublicKey,
    positionNftAccount: PublicKey,
    nft2022?: boolean
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods.closePosition().accounts({
      nftOwner: positionNftOwner,
      positionNftMint,
      positionNftAccount,
      tokenProgram: nft2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
    });

    return await instruction.instruction();
  }

  static async increasePositionFromLiquidityInstruction(
    positionNftOwner: PublicKey,
    positionNftAccount: PublicKey,
    personalPosition: PublicKey,

    poolId: PublicKey,
    protocolPosition: PublicKey,
    tickArrayLower: PublicKey,
    tickArrayUpper: PublicKey,
    ownerTokenAccountA: PublicKey,
    ownerTokenAccountB: PublicKey,
    mintVaultA: PublicKey,
    mintVaultB: PublicKey,
    mintMintA: PublicKey,
    mintMintB: PublicKey,

    liquidity: BN,
    amountMaxA: BN,
    amountMaxB: BN,

    exTickArrayBitmap?: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .increaseLiquidityV2(
        liquidity,
        amountMaxA,
        amountMaxB,
        null // baseFlag 设为 null，因为这是基于流动性的指令
      )
      .accountsPartial({
        nftOwner: positionNftOwner,
        nftAccount: positionNftAccount,
        poolState: poolId,
        protocolPosition,
        personalPosition,
        tickArrayLower,
        tickArrayUpper,
        tokenAccount0: ownerTokenAccountA,
        tokenAccount1: ownerTokenAccountB,
        tokenVault0: mintVaultA,
        tokenVault1: mintVaultB,
        vault0Mint: mintMintA,
        vault1Mint: mintMintB,
      });

    // 如果有额外的 tick array bitmap，添加为 remaining accounts
    if (exTickArrayBitmap) {
      instruction.remainingAccounts([
        { pubkey: exTickArrayBitmap, isSigner: false, isWritable: true },
      ]);
    }

    return await instruction.instruction();
  }

  static async increasePositionFromBaseInstruction(
    positionNftOwner: PublicKey,
    positionNftAccount: PublicKey,
    personalPosition: PublicKey,

    poolId: PublicKey,
    protocolPosition: PublicKey,
    tickArrayLower: PublicKey,
    tickArrayUpper: PublicKey,
    ownerTokenAccountA: PublicKey,
    ownerTokenAccountB: PublicKey,
    mintVaultA: PublicKey,
    mintVaultB: PublicKey,
    mintMintA: PublicKey,
    mintMintB: PublicKey,

    base: "MintA" | "MintB",
    baseAmount: BN,
    otherAmountMax: BN,

    exTickArrayBitmap?: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .increaseLiquidityV2(
        new BN(0), // liquidity 设为 0，因为是基于 base amount
        base === "MintA" ? baseAmount : otherAmountMax, // amount0Max
        base === "MintA" ? otherAmountMax : baseAmount, // amount1Max
        base === "MintA" // baseFlag
      )
      .accountsPartial({
        nftOwner: positionNftOwner,
        nftAccount: positionNftAccount,
        poolState: poolId,
        protocolPosition,
        personalPosition,
        tickArrayLower,
        tickArrayUpper,
        tokenAccount0: ownerTokenAccountA,
        tokenAccount1: ownerTokenAccountB,
        tokenVault0: mintVaultA,
        tokenVault1: mintVaultB,
        vault0Mint: mintMintA,
        vault1Mint: mintMintB,
      });

    // 如果有额外的 tick array bitmap，添加为 remaining accounts
    if (exTickArrayBitmap) {
      instruction.remainingAccounts([
        { pubkey: exTickArrayBitmap, isSigner: false, isWritable: true },
      ]);
    }

    return await instruction.instruction();
  }

  static async decreaseLiquidityInstruction(
    positionNftOwner: PublicKey,
    positionNftAccount: PublicKey,
    personalPosition: PublicKey,

    poolId: PublicKey,
    protocolPosition: PublicKey,
    tickArrayLower: PublicKey,
    tickArrayUpper: PublicKey,
    ownerTokenAccountA: PublicKey,
    ownerTokenAccountB: PublicKey,
    mintVaultA: PublicKey,
    mintVaultB: PublicKey,
    mintMintA: PublicKey,
    mintMintB: PublicKey,
    rewardAccounts: {
      poolRewardVault: PublicKey;
      ownerRewardVault: PublicKey;
      rewardMint: PublicKey;
    }[],

    liquidity: BN,
    amountMinA: BN,
    amountMinB: BN,

    exTickArrayBitmap?: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .decreaseLiquidityV2(liquidity, amountMinA, amountMinB)
      .accountsPartial({
        nftOwner: positionNftOwner,
        nftAccount: positionNftAccount,
        personalPosition,
        poolState: poolId,
        protocolPosition,
        tokenVault0: mintVaultA,
        tokenVault1: mintVaultB,
        tickArrayLower,
        tickArrayUpper,
        recipientTokenAccount0: ownerTokenAccountA,
        recipientTokenAccount1: ownerTokenAccountB,
        vault0Mint: mintMintA,
        vault1Mint: mintMintB,
      });

    // 构建 remaining accounts
    const remainingAccounts = [
      ...(exTickArrayBitmap
        ? [{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }]
        : []),
      ...rewardAccounts
        .map((i) => [
          { pubkey: i.poolRewardVault, isSigner: false, isWritable: true },
          { pubkey: i.ownerRewardVault, isSigner: false, isWritable: true },
          { pubkey: i.rewardMint, isSigner: false, isWritable: false },
        ])
        .flat(),
    ];

    if (remainingAccounts.length > 0) {
      instruction.remainingAccounts(remainingAccounts);
    }

    return await instruction.instruction();
  }

  static async swapInstruction(
    payer: PublicKey,
    poolId: PublicKey,
    ammConfigId: PublicKey,
    inputTokenAccount: PublicKey,
    outputTokenAccount: PublicKey,
    inputVault: PublicKey,
    outputVault: PublicKey,
    inputMint: PublicKey,
    outputMint: PublicKey,
    tickArray: PublicKey[],
    observationId: PublicKey,

    amount: BN,
    otherAmountThreshold: BN,
    sqrtPriceLimitX64: BN,
    isBaseInput: boolean,

    exTickArrayBitmap?: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .swapV2(amount, otherAmountThreshold, sqrtPriceLimitX64, isBaseInput)
      .accounts({
        payer,
        ammConfig: ammConfigId,
        poolState: poolId,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
        observationState: observationId,
        inputVaultMint: inputMint,
        outputVaultMint: outputMint,
      });

    // 构建 remaining accounts
    const remainingAccounts = [
      ...(exTickArrayBitmap
        ? [{ pubkey: exTickArrayBitmap, isSigner: false, isWritable: true }]
        : []),
      ...tickArray.map((i) => ({
        pubkey: i,
        isSigner: false,
        isWritable: true,
      })),
    ];

    if (remainingAccounts.length > 0) {
      instruction.remainingAccounts(remainingAccounts);
    }

    return await instruction.instruction();
  }

  static async initRewardInstruction(
    rewardFunder: PublicKey,
    funderTokenAccount: PublicKey,
    ammConfigId: PublicKey,
    poolId: PublicKey,
    rewardMint: PublicKey,
    rewardProgramId: PublicKey,

    openTime: number,
    endTime: number,
    emissionsPerSecondX64: BN
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .initializeReward({
        openTime: new BN(openTime),
        endTime: new BN(endTime),
        emissionsPerSecondX64,
      })
      .accounts({
        rewardFunder,
        funderTokenAccount,
        ammConfig: ammConfigId,
        poolState: poolId,
        rewardTokenMint: rewardMint,
        rewardTokenProgram: rewardProgramId,
      });

    return await instruction.instruction();
  }

  static async setRewardInstruction(
    authority: PublicKey,
    ammConfigId: PublicKey,
    poolId: PublicKey,

    rewardIndex: number,
    emissionsPerSecondX64: BN,
    openTime: number,
    endTime: number
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .setRewardParams(
        rewardIndex,
        emissionsPerSecondX64,
        new BN(openTime),
        new BN(endTime)
      )
      .accounts({
        authority,
        ammConfig: ammConfigId,
        poolState: poolId,
      });

    return await instruction.instruction();
  }

  static async collectRewardInstruction(
    rewardFunder: PublicKey,
    funderTokenAccount: PublicKey,
    poolId: PublicKey,
    rewardVault: PublicKey,
    rewardMint: PublicKey,

    rewardIndex: number
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .collectRemainingRewards(rewardIndex)
      .accounts({
        rewardFunder,
        funderTokenAccount,
        poolState: poolId,
        rewardTokenVault: rewardVault,
        rewardVaultMint: rewardMint,
      });

    return await instruction.instruction();
  }

  static async createAmmConfigInstruction(
    owner: PublicKey,
    ammConfigId: PublicKey,
    index: number,
    tickSpacing: number,
    tradeFeeRate: number,
    protocolFeeRate: number,
    fundFeeRate: number
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .createAmmConfig(
        index,
        tickSpacing,
        tradeFeeRate,
        protocolFeeRate,
        fundFeeRate
      )
      .accountsPartial({
        owner,
        ammConfig: ammConfigId,
      });

    return await instruction.instruction();
  }

  static async updateAmmConfigInstruction(
    programId: PublicKey,
    ammConfigId: PublicKey,
    owner: PublicKey,
    param: number,
    value: number,
    remainingAccounts?: {
      pubkey: PublicKey;
      isSigner: boolean;
      isWritable: boolean;
    }[]
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .updateAmmConfig(param, value)
      .accounts({
        owner,
        ammConfig: ammConfigId,
      })
      .remainingAccounts(remainingAccounts || []);

    return await instruction.instruction();
  }

  static async updatePoolStatusInstruction(
    authority: PublicKey,
    poolState: PublicKey,
    status: number
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods.updatePoolStatus(status).accounts({
      poolState,
      authority,
    });

    return await instruction.instruction();
  }

  static async createSupportMintAssociatedInstruction(
    owner: PublicKey,
    tokenMint: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods.createSupportMintAssociated().accounts({
      owner,
      tokenMint,
    });

    return await instruction.instruction();
  }

  static async createOperationAccountInstruction(
    owner: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods.createOperationAccount().accounts({
      owner,
    });

    return await instruction.instruction();
  }

  static async updateOperationAccountInstruction(
    owner: PublicKey,
    param: number,
    keys: PublicKey[]
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .updateOperationAccount(param, keys)
      .accounts({
        owner,
      });

    return await instruction.instruction();
  }

  static async transferRewardOwnerInstruction(
    authority: PublicKey,
    poolState: PublicKey,
    newOwner: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods.transferRewardOwner(newOwner).accounts({
      poolState,
      authority,
    });

    return await instruction.instruction();
  }

  static async updateRewardInfosInstruction(
    poolState: PublicKey
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods.updateRewardInfos().accounts({
      poolState,
    });

    return await instruction.instruction();
  }

  static async collectProtocolFeeInstruction(
    poolState: PublicKey,
    tokenVault0: PublicKey,
    tokenVault1: PublicKey,
    vault0Mint: PublicKey,
    vault1Mint: PublicKey,

    amount0Requested: BN,
    amount1Requested: BN
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .collectProtocolFee(amount0Requested, amount1Requested)
      .accounts({
        poolState,
        tokenVault0,
        tokenVault1,
        vault0Mint,
        vault1Mint,
      });

    return await instruction.instruction();
  }

  static async collectFundFeeInstruction(
    poolState: PublicKey,
    tokenVault0: PublicKey,
    tokenVault1: PublicKey,
    vault0Mint: PublicKey,
    vault1Mint: PublicKey,

    amount0Requested: BN,
    amount1Requested: BN
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .collectFundFee(amount0Requested, amount1Requested)
      .accounts({
        poolState,
        tokenVault0,
        tokenVault1,
        vault0Mint,
        vault1Mint,
      });

    return await instruction.instruction();
  }

  static async _legacy_openPosition(
    payer: PublicKey,
    positionNftOwner: PublicKey,
    positionNftMint: PublicKey,
    positionNftAccount: PublicKey,
    metadataAccount: PublicKey,
    poolState: PublicKey,
    protocolPosition: PublicKey,
    tickArrayLower: PublicKey,
    tickArrayUpper: PublicKey,
    personalPosition: PublicKey,
    tokenAccount0: PublicKey,
    tokenAccount1: PublicKey,
    tokenVault0: PublicKey,
    tokenVault1: PublicKey,

    tickLowerIndex: number,
    tickUpperIndex: number,
    tickArrayLowerStartIndex: number,
    tickArrayUpperStartIndex: number,
    liquidity: BN,
    amount0Max: BN,
    amount1Max: BN,

    remainingAccounts?: {
      pubkey: PublicKey;
      isSigner: boolean;
      isWritable: boolean;
    }[]
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .openPosition(
        tickLowerIndex,
        tickUpperIndex,
        tickArrayLowerStartIndex,
        tickArrayUpperStartIndex,
        liquidity,
        amount0Max,
        amount1Max
      )
      .accountsPartial({
        payer,
        positionNftOwner,
        positionNftMint,
        positionNftAccount,
        metadataAccount,
        poolState,
        protocolPosition,
        tickArrayLower,
        tickArrayUpper,
        personalPosition,
        tokenAccount0,
        tokenAccount1,
        tokenVault0,
        tokenVault1,
      });

    // 添加 remaining accounts
    if (remainingAccounts && remainingAccounts.length > 0) {
      instruction.remainingAccounts(remainingAccounts);
    }

    return await instruction.instruction();
  }

  static async _legacy_increaseLiquidity(
    nftOwner: PublicKey,
    nftAccount: PublicKey,
    poolState: PublicKey,
    protocolPosition: PublicKey,
    personalPosition: PublicKey,
    tickArrayLower: PublicKey,
    tickArrayUpper: PublicKey,
    tokenAccount0: PublicKey,
    tokenAccount1: PublicKey,
    tokenVault0: PublicKey,
    tokenVault1: PublicKey,

    liquidity: BN,
    amount0Max: BN,
    amount1Max: BN,

    remainingAccounts?: {
      pubkey: PublicKey;
      isSigner: boolean;
      isWritable: boolean;
    }[]
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .increaseLiquidity(liquidity, amount0Max, amount1Max)
      .accountsPartial({
        nftOwner,
        nftAccount,
        poolState,
        protocolPosition,
        personalPosition,
        tickArrayLower,
        tickArrayUpper,
        tokenAccount0,
        tokenAccount1,
        tokenVault0,
        tokenVault1,
      });

    // 添加 remaining accounts
    if (remainingAccounts && remainingAccounts.length > 0) {
      instruction.remainingAccounts(remainingAccounts);
    }

    return await instruction.instruction();
  }

  static async _legacy_decreaseLiquidity(
    nftOwner: PublicKey,
    nftAccount: PublicKey,
    personalPosition: PublicKey,
    poolState: PublicKey,
    protocolPosition: PublicKey,
    tokenVaultA: PublicKey,
    tokenVaultB: PublicKey,
    tickArrayLower: PublicKey,
    tickArrayUpper: PublicKey,
    recipientTokenAccountA: PublicKey,
    recipientTokenAccountB: PublicKey,

    liquidity: BN,
    amountAMin: BN,
    amountBMin: BN,

    remainingAccounts?: {
      pubkey: PublicKey;
      isSigner: boolean;
      isWritable: boolean;
    }[]
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .decreaseLiquidity(liquidity, amountAMin, amountBMin)
      .accountsPartial({
        nftOwner,
        nftAccount,
        personalPosition,
        poolState,
        protocolPosition,
        tokenVault0: tokenVaultA,
        tokenVault1: tokenVaultB,
        tickArrayLower,
        tickArrayUpper,
        recipientTokenAccount0: recipientTokenAccountA,
        recipientTokenAccount1: recipientTokenAccountB,
      });

    // 添加 remaining accounts
    if (remainingAccounts && remainingAccounts.length > 0) {
      instruction.remainingAccounts(remainingAccounts);
    }

    return await instruction.instruction();
  }

  static async _legacy_swap(
    payer: PublicKey,
    ammConfig: PublicKey,
    poolState: PublicKey,
    inputTokenAccount: PublicKey,
    outputTokenAccount: PublicKey,
    inputVault: PublicKey,
    outputVault: PublicKey,
    observationState: PublicKey,
    tickArray: PublicKey[],

    amount: BN,
    otherAmountThreshold: BN,
    sqrtPriceLimitX64: BN,
    isBaseInput: boolean,

    remainingAccounts?: {
      pubkey: PublicKey;
      isSigner: boolean;
      isWritable: boolean;
    }[]
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    // 第一个 tick array 作为必需的账户，其余的作为 remaining accounts
    const [firstTickArray, ...restTickArrays] = tickArray;

    const instruction = program.methods
      .swap(amount, otherAmountThreshold, sqrtPriceLimitX64, isBaseInput)
      .accounts({
        payer,
        ammConfig,
        poolState,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
        observationState,
        tickArray: firstTickArray,
      });

    // 构建 remaining accounts，包括剩余的 tick arrays 和额外的账户
    const allRemainingAccounts = [
      ...restTickArrays.map((pubkey) => ({
        pubkey,
        isSigner: false,
        isWritable: true,
      })),
      ...(remainingAccounts || []),
    ];

    if (allRemainingAccounts.length > 0) {
      instruction.remainingAccounts(allRemainingAccounts);
    }

    return await instruction.instruction();
  }

  // 初始化管理员组
  static async initAmmAdminGroupInstruction(params: {
    feeKeeper: PublicKey;
    rewardConfigManager: PublicKey;
    rewardClaimManager: PublicKey;
    poolManager: PublicKey;
    emergencyManager: PublicKey;
    normalManager: PublicKey;
  }): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods.initAmmAdminGroup({
      feeKeeper: params.feeKeeper,
      rewardConfigManager: params.rewardConfigManager,
      rewardClaimManager: params.rewardClaimManager,
      poolManager: params.poolManager,
      emergencyManager: params.emergencyManager,
      normalManager: params.normalManager,
    });

    return await instruction.instruction();
  }

  // 更新管理员组
  static async updateAmmAdminGroupInstruction(params: {
    feeKeeper?: PublicKey;
    rewardConfigManager?: PublicKey;
    rewardClaimManager?: PublicKey;
    poolManager?: PublicKey;
    emergencyManager?: PublicKey;
    normalManager?: PublicKey;
  }): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods.updateAmmAdminGroup({
      feeKeeper: params.feeKeeper ?? null,
      rewardConfigManager: params.rewardConfigManager ?? null,
      rewardClaimManager: params.rewardClaimManager ?? null,
      poolManager: params.poolManager ?? null,
      emergencyManager: params.emergencyManager ?? null,
      normalManager: params.normalManager ?? null,
    });

    return await instruction.instruction();
  }

  // 新增的链下奖励相关指令
  static async depositOffchainRewardInstruction(
    poolId: PublicKey,
    payer: PublicKey,
    authority: PublicKey,
    tokenMint: PublicKey,
    payerTokenAccount: PublicKey,
    tokenProgram: PublicKey,
    amount: BN
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .depositOffchainReward(amount)
      .accountsPartial({
        payer,
        poolId,
        authority,
        tokenMint,
        payerTokenAccount,
        tokenProgram,
      });

    return await instruction.instruction();
  }

  static async claimOffchainRewardInstruction(
    poolId: PublicKey,
    claimer: PublicKey,
    authority: PublicKey,
    tokenMint: PublicKey,
    claimerTokenAccount: PublicKey,
    tokenProgram: PublicKey,
    amount: BN
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .claimOffchainReward(amount)
      .accountsPartial({
        claimer,
        authority,
        poolId,
        tokenMint,
        claimerTokenAccount,
        tokenProgram,
      });

    return await instruction.instruction();
  }

  static async withdrawOffchainRewardInstruction(
    poolId: PublicKey,
    authority: PublicKey,
    tokenMint: PublicKey,
    receiverTokenAccount: PublicKey,
    tokenProgram: PublicKey,
    amount: BN
  ): Promise<TransactionInstruction> {
    const program = getAmmV3Program();

    const instruction = program.methods
      .withdrawOffchainReward(amount)
      .accountsPartial({
        authority,
        tokenMint,
        poolId,
        receiverTokenAccount,
        tokenProgram,
      });

    return await instruction.instruction();
  }
}
