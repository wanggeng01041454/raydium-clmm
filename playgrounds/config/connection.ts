// import "./env";

import { Connection } from "@solana/web3.js";

const localRpcUrl = "http://127.0.0.1:8899";

const localConnection = new Connection(localRpcUrl, "confirmed");

const mainnetRpcUrl =
  "https://summer-dry-gadget.solana-mainnet.quiknode.pro/2cd2791930b76d348c55458ab3aeb65a84ee27af";

const mainnetConnection = new Connection(mainnetRpcUrl);

const connection = localConnection;
const rpcUrl = localRpcUrl;

// const connection = mainnetConnection;
// const rpcUrl = mainnetRpcUrl;

export {
  localConnection,
  localRpcUrl,
  mainnetConnection,
  mainnetRpcUrl,
  connection,
  rpcUrl,
};
