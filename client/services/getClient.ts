import { createPublicClient, createWalletClient, custom, type Hex, http } from "viem";
import { sepolia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

export async function getSigner() {
  if (!window.ethereum) {
    throw new Error("Please install MetaMask!");
  }
  const walletClient = createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
  });
  const [address] = await walletClient.requestAddresses();
  try {
    await walletClient.switchChain({ id: sepolia.id });
  } catch (error) {
    throw new Error("Your wallet is not connected to the Sepolia network.");
  }
  return createWalletClient({
    account: address as Hex,
    chain: sepolia,
    transport: custom(window.ethereum),
  });
}
