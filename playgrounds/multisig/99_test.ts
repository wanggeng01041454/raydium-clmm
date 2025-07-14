import { MultisigSDK, MultisigUtils } from "./sdk.js";

import { connection, wallet, wallet2, wallet3 } from "../config/index.js";
import { createKey } from "./config.js";

const creator = wallet;
const member2 = wallet2;
const member3 = wallet3;

async function main() {
  const [multisigPda] = MultisigUtils.getMultisigPda(createKey.publicKey);
  const sdk = new MultisigSDK({ connection, multisigPda });

  const proposals = await sdk.getProposals();
  console.log(proposals);
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}
