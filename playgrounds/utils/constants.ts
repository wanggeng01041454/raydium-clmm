import { PublicKey } from "@solana/web3.js";

export const TokenAddress = {
  RAY: new PublicKey("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"),
  USDC: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  USDT: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
  JUP: new PublicKey("JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"),
  SOL: new PublicKey("So11111111111111111111111111111111111111112"),
  ai16z: new PublicKey("HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC"), // token 2022
  PYUSD: new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo"), // token 2022
  IMG: new PublicKey("znv3FZt2HFAvzYf5LxzVyryh3mBXWuTRRng25gEZAjh"), // token 2022
};

export const PoolAddress = {
  RAY_USDC: new PublicKey("61R1ndXxvsWXXkWSyNkCxnzwd3zUNB8Q2ibmkiLPC8ht"),
  SOL_USDC: new PublicKey("CYbD9RaToYMtWKA7QZyoLahnHdWq553Vm62Lh6qWtuxq"),
};

export const ProgramAddress = new PublicKey(
  "REALQqNEomY6cQGZJUGwywTBD2UmDT32rZcNnfxQ5N2"
);
