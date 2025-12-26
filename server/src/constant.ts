import Redis from "ioredis";
import { createPublicClient, http, type Hex } from "viem";
import { sepolia } from "viem/chains";

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
export const MAX_TX_AGE_SECONDS = 10 * 60;
export const REDIS_TTL = MAX_TX_AGE_SECONDS + 120;

export const payTo = "0xd5de8324D526A201672B30584e495C71BeBb3e9A";
export const TOKEN_CONFIG = {
  address: "0x940A4894a2c72231c9AD70E6D32B7edadC8F76e3" as Hex,
  name: "USD Coin",
  decimals: 18,
};

export const REQUIRED_AMOUNT = 1000000000000000000n;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.INFURA_RPC_URL),
});
