import { type NextFunction, type Request, type Response } from "express";
import { encodeFunctionData, parseAbi, type Hex } from "viem";
import { sepolia } from "viem/chains";
import { MAX_TX_AGE_SECONDS, payTo, publicClient, redis, REDIS_TTL, REQUIRED_AMOUNT, TOKEN_CONFIG } from "./constant";

const decodeAndCheckInput = (inputData: Hex): boolean => {
  try {
    const expectedTransferData = encodeFunctionData({
      abi: parseAbi(["function transfer(address to, uint256 amount)"]),
      functionName: "transfer",
      args: [payTo as Hex, REQUIRED_AMOUNT],
    });

    const searchPattern = expectedTransferData.substring(2).toLowerCase();
    const fullInputData = inputData.toLowerCase();

    if (fullInputData.includes(searchPattern)) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Decode Error:", error);
    return false;
  }
};

export const handleTxPayment = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const paymentMetadata = {
      type: "TxHashPayment",
      networkId: sepolia.id,
      receiver: payTo,
      token: {
        symbol: TOKEN_CONFIG.name,
        address: TOKEN_CONFIG.address,
        decimals: TOKEN_CONFIG.decimals,
      },
      amount: REQUIRED_AMOUNT.toString(),
      instruction: "Send a Transaction Hash (txHash) in 'Authorization: Bearer <txHash>' header",
    };
    return res.status(402).json({
      error: "Payment required",
      message: "Please submit a TxHash",
      paymentInfo: paymentMetadata,
    });
  }

  const txHash = authHeader.replace("Bearer ", "") as Hex;

  try {
    const isFirstTime = await redis.set(txHash, "processing", "EX", REDIS_TTL, "NX");
    if (isFirstTime !== "OK") {
      console.warn(`⛔ Replay Attack Detected: ${txHash}`);
      return res.status(409).json({ error: "Transaction already used" });
    }
    console.log(`🔍 Checking TxHash: ${txHash}`);
    const tx = await publicClient.getTransaction({ hash: txHash }).catch(() => null);
    if (!tx) {
      console.log("❌ Tx not found anywhere");
      await redis.del(txHash);
      return res.status(403).json({ error: "Transaction not found in Mempool or Chain" });
    }
    if (tx.blockNumber) {
      const block = await publicClient.getBlock({ blockNumber: tx.blockNumber });
      const txAge = Math.floor(Date.now() / 1000) - Number(block.timestamp);

      if (txAge > MAX_TX_AGE_SECONDS) {
        console.log("❌ Tx too old");
        return res.status(403).json({ error: "Transaction expired (too old)" });
      }
    }
    const isPaymentValid = decodeAndCheckInput(tx.input);
    if (!isPaymentValid) {
      console.log("❌ Payment data mismatch");
      return res.status(403).json({ error: "Transaction data mismatch (Wrong amount/recipient)" });
    }
    await redis.set(txHash, "used", "KEEPTTL");
    console.log("⚡ Valid Tx detected. Serving content immediately...");
    next();
  } catch (e) {
    console.error("Validation failed:", e);
    await redis.del(txHash);
    if (!res.headersSent) {
      res.status(500).json({ error: "Validation failed" });
    }
  }
};
