import { BaseInstruction } from "./sdk/baseInstruction";
import { ProgramAddress } from "./utils/constants";
import {
  sendTransaction,
  serializeToBase58,
  simulateTransaction,
} from "./utils";
import { PublicKey } from "@solana/web3.js";
import { getPdaAmmConfigId } from "./utils/pda";
import { mainnetConnection } from "./config";
import { wallet } from "./config";

const AMM_CONFIG = {
  configIndex: 12,
  tickSpacing: 120,
  tradeFeeRate: 10000,
  protocolFeeRate: 120000,
  fundFeeRate: 0,
};

async function main() {
  const ammConfigId = getPdaAmmConfigId(ProgramAddress, AMM_CONFIG.configIndex);

  console.log("wallet ===>", wallet.publicKey.toBase58());
  console.log("ammConfigId ===>", ammConfigId.publicKey.toBase58());

  const newAddress = new PublicKey(
    "4ffwrzmyiwntY78SurN8E8PAmFZ5B5HAEx8FsHGg44ns"
  );

  try {
    const instruction = await BaseInstruction.createAmmConfigInstruction(
      wallet.publicKey,
      ammConfigId.publicKey,
      AMM_CONFIG.configIndex,
      AMM_CONFIG.tickSpacing,
      AMM_CONFIG.tradeFeeRate,
      AMM_CONFIG.protocolFeeRate,
      AMM_CONFIG.fundFeeRate
    );

    const instruction1 = await BaseInstruction.updateAmmConfigInstruction(
      ProgramAddress,
      ammConfigId.publicKey,
      wallet.publicKey,
      3,
      0,
      [
        {
          pubkey: newAddress,
          isSigner: false,
          isWritable: true,
        },
      ]
    );
    const instruction2 = await BaseInstruction.updateAmmConfigInstruction(
      ProgramAddress,
      ammConfigId.publicKey,
      wallet.publicKey,
      4,
      0,
      [
        {
          pubkey: newAddress,
          isSigner: false,
          isWritable: true,
        },
      ]
    );

    // ===== 模拟交易 =====
    // const rest = await simulateTransaction(mainnetConnection, wallet, [
    //   instruction,
    //   instruction1,
    //   instruction2,
    // ]);
    // console.log("rest ===>", rest);

    // ===== 序列化交易 =====
    // const base58 = await serializeToBase58(
    //   mainnetConnection,
    //   wallet.publicKey,
    //   [instruction, instruction1, instruction2]
    // );
    // console.log("base58 ===>", base58);

    // ===== 发送交易 =====
    // const txHash = await sendTransaction(mainnetConnection, wallet, [
    //   instruction,
    //   instruction1,
    //   instruction2,
    // ]);
    // console.log("txHash ===>", txHash);
    // console.log("ammConfigId ===>", ammConfigId.publicKey.toBase58());
  } catch (error) {
    console.error("Error creating AMM config:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
