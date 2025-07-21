import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";

import * as anchor from "@coral-xyz/anchor";

import {
  BuildType,
  BaseActionParams,
  ActionResult
} from "./baseTypes";

import {
  BuildActionResultParams,
  buildActionResult
} from "./utils";

import { ByrealClmm } from "../target/types/byreal_clmm";

import ClmmIDL from "../target/idl/byreal_clmm.json";
import { getAssociatedTokenAddress, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { CreateAmmConfigParams, CreatePoolParams, CreateSupportMintAssociatedParams, InitAdminGroupParams, ProgramAmmAdminGroupAccountData, ProgramAmmConfigAccountData, ProgramInitAdminGroupParams, ProgramSupportMintAssociatedAccountData } from "./byrealClmmTypes";
import Decimal from "decimal.js";






/**
 * 访问 ResetProgram 合约的 provider
 */
export class ByrealClmmProvider {
  protected connection: Connection;
  protected program: anchor.Program<ByrealClmm>;


  /**
   * @description 构造函数
   * @param connection 
   */
  constructor(
    connection: Connection,
    commitment?: Commitment
  ) {
    this.connection = connection;

    const options = anchor.AnchorProvider.defaultOptions();
    if (commitment) {
      options.commitment = commitment;
    }
    // 创建 anchor-provider
    const provider = new anchor.AnchorProvider(
      this.connection,
      {
        publicKey: PublicKey.default,
      } as anchor.Wallet,
      options
    );

    // 可以访问合约的 program
    this.program = new anchor.Program(ClmmIDL as ByrealClmm, provider);
  }


  public findAmmConfigAddress(index: number): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("amm_config"), new anchor.BN(index).toArrayLike(Buffer, "be", 2)],
      this.program.programId
    )[0];
  }

  public findAmmAdminGroupAddress(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("admin_group")],
      this.program.programId
    )[0];
  }

  public findSupportMintAssociatedAccountAddress(tokenMint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("support_mint"), tokenMint.toBuffer()],
      this.program.programId
    )[0];
  }

  public async getAdminGroupAccount(address: PublicKey): Promise<ProgramAmmAdminGroupAccountData> {
    return await this.program.account.ammAdminGroup.fetch(address);
  }

  public async getAmmConfigAccount(address: PublicKey): Promise<ProgramAmmConfigAccountData> {
    return await this.program.account.ammConfig.fetch(address);
  }

  public async getSupportMintAssociatedAccount(address: PublicKey): Promise<ProgramSupportMintAssociatedAccountData> {
    return await this.program.account.supportMintAssociated.fetch(address);
  }

  public async initAdminGroupAction(params: InitAdminGroupParams): Promise<ActionResult> {
    const args: ProgramInitAdminGroupParams = {
      feeKeeper: params.feeKeeper,
      rewardConfigManager: params.rewardConfigManager,
      rewardClaimManager: params.rewardClaimManager,
      poolManager: params.poolManager,
      emergencyManager: params.emergencyManager,
      normalManager: params.normalManager,
    };

    const ix = await this.program.methods
      .initAmmAdminGroup(args).instruction();

    const buildParams: BuildActionResultParams = {
      buildType: params.buildType,
      cuPrice: params.cuPrice,
      cuFactor: params.cuFactor,

      connection: this.connection,
      ixs: [ix],
      payer: params.superAdmin,
      signers: [params.superAdminKeypair].filter(kp => kp !== undefined) as Keypair[],
    };

    return await buildActionResult(buildParams);
  }


  public async createAmmConfigAction(params: CreateAmmConfigParams): Promise<ActionResult> {
    const ammConfigAddress = this.findAmmConfigAddress(params.index);
    const accounts = {
      owner: params.owner,
      ammConfig: ammConfigAddress,
    };

    const ix = await this.program.methods
      .createAmmConfig(
        params.index,
        params.tickSpacing,
        params.tradeFeeRate,
        params.protocolFeeRate,
        params.fundFeeRate
      )
      .accounts(accounts)
      .instruction();

    const buildParams: BuildActionResultParams = {
      buildType: params.buildType,
      cuPrice: params.cuPrice,
      cuFactor: params.cuFactor,

      connection: this.connection,
      ixs: [ix],
      payer: params.owner,
      signers: [params.ownerKeypair].filter(kp => kp !== undefined) as Keypair[],
    };

    return await buildActionResult(buildParams);
  }

  /**
   * @description 将价格转换为 sqrtPriceX64, sqrt(price*10^decimalsB / 10^decimalsA) * 2^64
   * @param price 
   * @param decimalsA 
   * @param decimalsB 
   * @returns 
   */
  public price2SqrtPriceX64(price: number, decimalsA: number, decimalsB: number): anchor.BN {
    // 设置高精度
    Decimal.config({ precision: 50 });

    let priceDecimal = new Decimal(price);

    // 处理小数位差异
    const decimalDiff = decimalsB - decimalsA;
    if (decimalDiff !== 0) {
      const powerOfTen = new Decimal(10).pow(decimalDiff);
      priceDecimal = priceDecimal.mul(powerOfTen);
    }

    // 计算平方根
    const sqrtPrice = priceDecimal.sqrt();

    // 乘以 2^64
    const twoToThe64 = new Decimal(2).pow(64);
    const result = sqrtPrice.mul(twoToThe64);

    // 转换为 BN
    return new anchor.BN(result.floor().toString());
  }

  /**
   * @description 比较两个公钥的字节值, 1>2 返回 1, 1<2 返回 -1, 1=2 返回 0
   * @param pubkey1 
   * @param pubkey2 
   * @returns 
   */
  public comparePublicKeys(pubkey1: PublicKey, pubkey2: PublicKey): number {
    const bytes1 = pubkey1.toBytes();
    const bytes2 = pubkey2.toBytes();

    for (let i = 0; i < 32; i++) {
      if (bytes1[i] < bytes2[i]) return -1;
      if (bytes1[i] > bytes2[i]) return 1;
    }
    return 0;
  }

  public async createSupportMintAssociatedAction(params: CreateSupportMintAssociatedParams): Promise<ActionResult> {

    const ix = await this.program.methods
      .createSupportMintAssociated()
      .accounts({
        owner: params.owner,
        tokenMint: params.tokenMint,
      })
      .instruction();

    const buildParams: BuildActionResultParams = {
      buildType: params.buildType,
      cuPrice: params.cuPrice,
      cuFactor: params.cuFactor,

      connection: this.connection,
      ixs: [ix],
      payer: params.owner,
      signers: [params.ownerKeypair].filter(kp => kp !== undefined) as Keypair[],
    };

    return await buildActionResult(buildParams);
  }

  /**
   * @description 创建交易池
   * @description 
   * @param params 
   * @returns 
   */
  public async createPoolAction(params: CreatePoolParams): Promise<ActionResult> {

    const accounts = {
      poolCreator: params.poolCreator,
      poolManager: params.poolManager,
      ammConfig: params.ammConfigId,
      tokenMint0: params.mintA,
      tokenMint1: params.mintB,
      tokenProgram0: params.mintAProgramId,
      tokenProgram1: params.mintBProgramId,
    };

    const openTime: anchor.BN = params.openTime ? new anchor.BN(params.openTime) : new anchor.BN(0);

    const remainingAccounts = params.remainAccounts?.map((pubkey) => ({
      pubkey,
      isWritable: true,
      isSigner: false,
    })) || [];

    // 构造指令
    const ix = await this.program.methods
      .createPool(params.sqrtPriceX64, openTime)
      .accounts(accounts)
      .remainingAccounts(remainingAccounts)
      .instruction();

    const buildParams: BuildActionResultParams = {
      buildType: params.buildType,
      cuPrice: params.cuPrice,
      cuFactor: params.cuFactor,

      connection: this.connection,
      ixs: [ix],
      payer: params.poolCreator,
      signers: [params.poolCreatorKeypair, params.poolManagerKeypair].filter(kp => kp !== undefined) as Keypair[],
    };

    return await buildActionResult(buildParams);
  }

}
