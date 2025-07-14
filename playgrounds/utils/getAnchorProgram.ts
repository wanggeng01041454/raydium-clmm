import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { connection } from "../config";
import { Keypair } from "@solana/web3.js";

// import { AmmRouting } from "../../target/types/amm_routing";
// const AMM_ROUTING_IDL = require("../../target/idl/amm_routing.json");

const getProvider = async (keypair: Keypair) => {
  const wallet = {
    publicKey: keypair.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(keypair);
      return tx;
    },
    signAllTransactions: async (txs) => {
      return txs.map((tx) => {
        tx.partialSign(keypair);
        return tx;
      });
    },
  };

  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  return provider;
};

// export const getAmmRoutingProgram = async (
//   keypair: Keypair
// ): Promise<Program<AmmRouting>> => {
//   const provider = await getProvider(keypair);
//   // 初始化程序
//   const program = new Program<AmmRouting>(AMM_ROUTING_IDL as any, provider);

//   return program;
// };
