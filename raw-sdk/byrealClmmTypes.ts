import { ByrealClmm } from "../target/types/byreal_clmm";

import ClmmIDL from "../target/idl/byreal_clmm.json";
import { BaseActionParams } from "./baseTypes";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

// 合约接口类型定义
export type ProgramInitAdminGroupParams = anchor.IdlTypes<ByrealClmm>["initAdminGroupParams"];


// 合约状态数据类型
export type ProgramAmmAdminGroupAccountData = anchor.IdlTypes<ByrealClmm>["ammAdminGroup"];
export type ProgramAmmConfigAccountData = anchor.IdlTypes<ByrealClmm>["ammConfig"];


export interface InitAdminGroupParams extends BaseActionParams {
  superAdmin: PublicKey;
  superAdminKeypair?: Keypair;

  feeKeeper: PublicKey;
  rewardConfigManager: PublicKey;
  rewardClaimManager: PublicKey;
  poolManager: PublicKey;
  emergencyManager: PublicKey;
  normalManager: PublicKey;
}


export interface CreateAmmConfigParams extends BaseActionParams {
  owner: PublicKey,
  ownerKeypair?: Keypair,

  index: number,
  tickSpacing: number,
  tradeFeeRate: number,
  protocolFeeRate: number,
  fundFeeRate: number
}

// 辅助类型参数
/**
 * @description 
 * 特别说明： 所有的 *Keypair参数，都是可选的，只有在 buildType 为 SendAndFinalizeTx 或 SendAndConfirmTx 时，才需要传入
 */
export interface CreatePoolParams extends BaseActionParams {
  poolCreator: PublicKey,
  poolCreatorKeypair?: Keypair,

  poolManager: PublicKey,
  poolManagerKeypair?: Keypair,

  ammConfigId: PublicKey,

  mintA: PublicKey,
  mintAProgramId: PublicKey,

  mintB: PublicKey,
  mintBProgramId: PublicKey,

  sqrtPriceX64: anchor.BN,

  openTime?: anchor.BN,

  remainAccounts?: PublicKey[]
}
