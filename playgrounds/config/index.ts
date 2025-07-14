export * from "./connection";
export * from "./wallet";

import { Keypair } from "@solana/web3.js";
import { getPdaAmmConfigId, getPdaPoolId } from "../utils/pda";
import { ProgramAddress } from "../utils";

const AMM_CONFIG = {
  configIndex: 1,
  tickSpacing: 10,
  tradeFeeRate: 100, // 0.01%
  protocolFeeRate: 120000, // 12%
  fundFeeRate: 4000, // 0.4%
};

const token0KeyPair = Keypair.fromSecretKey(
  Buffer.from([
    131, 231, 204, 108, 103, 117, 220, 35, 155, 128, 73, 214, 173, 11, 228, 189,
    181, 82, 9, 163, 241, 199, 32, 43, 227, 89, 169, 0, 159, 87, 180, 227, 176,
    164, 142, 31, 88, 80, 30, 9, 33, 221, 142, 74, 147, 239, 169, 38, 44, 77,
    162, 193, 136, 218, 33, 75, 181, 201, 202, 236, 175, 233, 211, 237,
  ])
);

const token1KeyPair = Keypair.fromSecretKey(
  Buffer.from([
    0, 254, 18, 44, 57, 125, 151, 215, 176, 154, 133, 171, 16, 252, 219, 125,
    165, 107, 133, 129, 206, 51, 231, 255, 119, 241, 155, 168, 227, 64, 140,
    182, 143, 7, 239, 143, 37, 193, 51, 136, 92, 155, 160, 161, 125, 201, 80,
    216, 173, 250, 196, 15, 94, 208, 75, 118, 221, 207, 119, 151, 192, 153, 103,
    149,
  ])
);

const [token0Mint, token1Mint] =
  token0KeyPair.publicKey
    .toBuffer()
    .compare(token1KeyPair.publicKey.toBuffer()) > 0
    ? [token1KeyPair.publicKey, token0KeyPair.publicKey]
    : [token0KeyPair.publicKey, token1KeyPair.publicKey];

const { publicKey: ammConfigId } = getPdaAmmConfigId(
  ProgramAddress,
  AMM_CONFIG.configIndex
);

const { publicKey: poolId } = getPdaPoolId(
  ProgramAddress,
  ammConfigId,
  token0Mint,
  token1Mint
);

export {
  AMM_CONFIG,
  token0KeyPair,
  token1KeyPair,
  token0Mint,
  token1Mint,
  ammConfigId,
  poolId,
};
