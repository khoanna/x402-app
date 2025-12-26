import { signerToEcdsaValidator } from "@botanary/ecdsa-validator";
import { createKernelAccount } from "@botanary/sdk/accounts";
import { publicClient } from "./getClient";
import { getEntryPoint, KERNEL_V3_3 } from "@botanary/sdk/constants";
import { Signer } from "@botanary/sdk/types";
import { createKernelAccountClient } from "@botanary/sdk";
import { sepolia } from "viem/chains";
import { type Hex, http, zeroAddress } from "viem";
import { getSessionPrivateKey } from "@/utils/localStorage";
import { privateKeyToAccount } from "viem/accounts";


export async function sendDeployTransaction() {
  const signer = privateKeyToAccount(getSessionPrivateKey()! as Hex);
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint: getEntryPoint("0.7"),
    kernelVersion: KERNEL_V3_3,
  });
  const account = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint: getEntryPoint("0.7"),
    kernelVersion: KERNEL_V3_3,
  });
  const kernelClient = createKernelAccountClient({
    account,
    chain: sepolia,
    bundlerTransport: http(process.env.NEXT_PUBLIC_ZERODEV_RPC),
    client: publicClient,
  });
  const userOpHash = await kernelClient.sendUserOperation({
    callData: await account.encodeCalls([
      {
        to: zeroAddress,
        value: BigInt(0),
        data: "0x",
      },
    ]),
  });

  const _receipt = await kernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });
}
