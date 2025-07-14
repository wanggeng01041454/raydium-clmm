import { BaseInstruction } from "./sdk/baseInstruction";
import { ProgramAddress } from "./utils/constants";
import { sendTransaction } from "./utils";
import { getPdaAmmConfigId } from "./utils/pda";
import { AMM_CONFIG, wallet, connection } from "./config";

async function main() {
  const ammConfigId = getPdaAmmConfigId(ProgramAddress, AMM_CONFIG.configIndex);

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

    const txHash = await sendTransaction(connection, wallet, [instruction]);
    console.log("txHash ===>", txHash);
    console.log("ammConfigId ===>", ammConfigId.publicKey.toBase58());
  } catch (error) {
    console.error("Error creating AMM config:", error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
