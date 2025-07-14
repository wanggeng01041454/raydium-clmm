import { Keypair } from "@solana/web3.js";

import bs58 from "bs58";

const wallet = Keypair.fromSecretKey(
  bs58.decode(
    "2wjauVm3WwJD4KrTJR16vjHfWJFSc5cmdsoxfqJat1CzKtSQyVBL2t8rwpmnLZg96VEpTVMkHgsVo1rePfaYc73F"
  )
);

const wallet2 = Keypair.fromSecretKey(
  bs58.decode(
    "wYsoLXn6SxkSbfEEqQPVYZKAqWWC5MkNV3hq5mLNYuPraBB8rNytarhTnGnpGKFbbAF1xnU9NT659CTmzmK6GYi"
  )
);

const wallet3 = Keypair.fromSecretKey(
  bs58.decode(
    "5JW79DXANTw59h61uucPNzpiAaJL5BHs4R6wuCBzezG2cAcEdWgbMcvGTUG6tDLFkKckDBYsVEcBqRzbZvUvycSS"
  )
);

export { wallet, wallet2, wallet3 };
