import { Connection } from "@solana/web3.js";
import { createMockXStockToken2022, readDefaultKeypair } from "../utils";


async function main() {
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  const payerKeypair = await readDefaultKeypair();
  console.log(`Payer Public Key: ${payerKeypair.publicKey.toBase58()}`);

  const mintPubkey = await createMockXStockToken2022({
    connection,
    payerKeypair,
    authority: payerKeypair.publicKey,
    decimals: 6,
  });

  console.log(`Mint Public Key: ${mintPubkey.toBase58()}`);
}

main().catch(err => {
  console.dir(err);
  process.exit(1);
});