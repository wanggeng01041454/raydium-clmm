import { PublicKey } from "@solana/web3.js";
import { BaseInstruction } from "./sdk/baseInstruction";
import { ProgramAddress } from "./utils/constants";
import { sendTransaction } from "./utils";
import { wallet } from "./config";

async function main() {
  const ammConfigId = new PublicKey(
    "96FHuHDcv9FL55qhoBoUGAmxZg9XM47fBM3t2vdefGW2"
  );

  const newAddress = new PublicKey(
    "4ffwrzmyiwntY78SurN8E8PAmFZ5B5HAEx8FsHGg44ns"
  );

  // 3 表示 new owner
  // 4 表示 new fund owner
  try {
    const instruction1 = await BaseInstruction.updateAmmConfigInstruction(
      ProgramAddress,
      ammConfigId,
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
      ammConfigId,
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

    const txHash = await sendTransaction(wallet, [instruction1, instruction2]);
    console.log("txHash ===>", txHash);
  } catch (error) {
    console.error("Error creating AMM config:", error);
  }
}

if (require.main === module) {
  // main().catch(console.error);
}
