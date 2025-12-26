import express, { type NextFunction, type Request, type Response } from "express";
import { createPublicClient, http, encodeFunctionData, parseAbi, type Hex } from "viem";
import { sepolia } from "viem/chains";
import Redis from "ioredis";
import dotenv from "dotenv";
import { handleTxPayment } from "./middleware";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/weather", handleTxPayment, (req: Request, res: Response) => {
  res.send({
    report: {
      location: "Vietnam",
      weather: "sunny",
      temperature: 70,
      note: "Served instantly via Optimistic Payment (TxHash)",
    },
  });
});

app.listen(3000, () => {
  console.log(`🚀 Server listening at http://localhost:3000`);
});