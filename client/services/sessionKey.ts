import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { toECDSASigner } from "@botanary/permissions/signers";
import { http, parseAbi, parseUnits, zeroAddress, type Hex } from "viem";
import { getSessionPrivateKey, getUsdcPerPay, storeSessionPrivateKey, storeSessionPublicKey, storeUsdcPerPay } from "@/utils/localStorage";
import { signerToEcdsaValidator } from "@botanary/ecdsa-validator";
import { getEntryPoint, KERNEL_V3_3 } from "@botanary/sdk/constants";
import { addressToEmptyAccount, createKernelAccount, createKernelAccountClient, type KernelSmartAccountImplementation } from "@botanary/sdk";
import { deserializePermissionAccount, serializePermissionAccount, toInitConfig, toPermissionValidator } from "@botanary/permissions";
import { type SmartAccount } from "viem/account-abstraction";
import { publicClient } from "./getClient";
import { sepolia } from "viem/chains";
import { CallPolicyVersion, ParamCondition, toCallPolicy, toRateLimitPolicy, toSudoPolicy } from "@botanary/permissions/policies";
import { BE_WALLET_ADDRESS, USDC_ADDRESS } from "@/constants";
import { Signer } from "@botanary/sdk/types";

const TEN_MINUTES = 10 * 1000 * 60;

// const rateLimitPolicy = toRateLimitPolicy({
//   count: 1,
//   interval: TEN_MINUTES,
// });

// function getTransferPolicy(usdcPerPay: string) {
//   const transferPolicy = toCallPolicy({
//     policyVersion: CallPolicyVersion.V0_0_4,
//     permissions: [
//       {
//         target: USDC_ADDRESS as Hex,
//         abi: parseAbi(["function transfer(address to, uint256 amount)"]),
//         functionName: "transfer",
//         args: [
//           {
//             condition: ParamCondition.EQUAL,
//             value: BE_WALLET_ADDRESS as Hex,
//           },
//           {
//             condition: ParamCondition.LESS_THAN_OR_EQUAL,
//             value: parseUnits(usdcPerPay, 6),
//           },
//         ],
//       },
//     ],
//   });
//   return transferPolicy;
// }

function getTransferPolicy(usdcPerPay: string) {
  const transferPolicy = toSudoPolicy({});
  return transferPolicy;
}

export async function createSessionKey(): Promise<Hex> {
  const sessionPrivateKey = generatePrivateKey();
  storeSessionPrivateKey(sessionPrivateKey);
  const sessionKeySigner = await toECDSASigner({
    signer: privateKeyToAccount(sessionPrivateKey),
  });
  storeSessionPublicKey(sessionKeySigner.account.address);
  return sessionKeySigner.account.address;
}

export async function approveSessionKey(signer: Signer, sessionKeyAddress: Hex, usdcPerPay: string): Promise<string> {
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: signer,
    entryPoint: getEntryPoint("0.7"),
    kernelVersion: KERNEL_V3_3,
  });
  const emptyAccount = addressToEmptyAccount(sessionKeyAddress);
  const emptySessionKeySigner = await toECDSASigner({ signer: emptyAccount });
  const permissionPlugin = await toPermissionValidator(publicClient, {
    entryPoint: getEntryPoint("0.7"),
    kernelVersion: KERNEL_V3_3,
    signer: emptySessionKeySigner,
    policies: [getTransferPolicy(usdcPerPay)],
  });
  storeUsdcPerPay(usdcPerPay);
  const sessionKeyAccount = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint("0.7"),
    kernelVersion: KERNEL_V3_3,
    plugins: {
      sudo: ecdsaValidator,
      regular: permissionPlugin,
    },
  });
  const serializedAccount = await serializePermissionAccount(sessionKeyAccount as SmartAccount<KernelSmartAccountImplementation>, undefined, undefined, undefined, permissionPlugin);
  localStorage.setItem("serializedSessionKeyAccount", serializedAccount);
  return serializedAccount;
}

export async function revokeSessionKey(signer: Signer, sessionKeyAddress: Hex): Promise<Hex> {
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: signer,
    entryPoint: getEntryPoint("0.7"),
    kernelVersion: KERNEL_V3_3,
  });
  const emptyAccount = addressToEmptyAccount(sessionKeyAddress);
  const emptySessionKeySigner = await toECDSASigner({ signer: emptyAccount });
  const permissionPlugin = await toPermissionValidator(publicClient, {
    entryPoint: getEntryPoint("0.7"),
    kernelVersion: KERNEL_V3_3,
    signer: emptySessionKeySigner,
    policies: [getTransferPolicy(getUsdcPerPay()!)],
  });
  const sudoAccount = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint("0.7"),
    kernelVersion: KERNEL_V3_3,
    plugins: {
      sudo: ecdsaValidator,
    },
  });
  const sudoKernelClient = createKernelAccountClient({
    account: sudoAccount,
    chain: sepolia,
    bundlerTransport: http(process.env.NEXT_PUBLIC_ZERODEV_RPC),
    client: publicClient,
  });
  const txHash = await sudoKernelClient.uninstallPlugin({
    plugin: permissionPlugin,
  });
  return txHash;
}

export async function usingSessionKey() {
  const approval = localStorage.getItem("serializedSessionKeyAccount")!;
  const sessionKeySigner = await toECDSASigner({
    signer: privateKeyToAccount(getSessionPrivateKey()! as Hex),
  });
  const sessionKeyAccount = await deserializePermissionAccount(publicClient, getEntryPoint("0.7"), KERNEL_V3_3, approval, sessionKeySigner);
  const kernelClient = createKernelAccountClient({
    account: sessionKeyAccount,
    chain: sepolia,
    bundlerTransport: http(process.env.NEXT_PUBLIC_ZERODEV_RPC),
    client: publicClient,
  });
  const userOpHash = await kernelClient.sendUserOperation({
    callData: await sessionKeyAccount.encodeCalls([
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
  return kernelClient;
}
