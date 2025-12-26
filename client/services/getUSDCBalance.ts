import { formatUnits, parseAbi, type Address, type PublicClient } from "viem";
import { publicClient } from "./getClient";
import { USDC_ADDRESS, USDC_DECIMALS } from "@/constants";

export async function getUSDCBalance(userAddress: Address): Promise<string> {
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: parseAbi(["function balanceOf(address owner) view returns (uint256)"]),
      functionName: "balanceOf",
      args: [userAddress],
    });
    const formattedBalance = formatUnits(balance, USDC_DECIMALS);
    return formattedBalance;
  } catch (error) {
    console.error("❌ Error:", error);
    return "0";
  }
}
