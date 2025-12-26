`use client`;
import { getUSDCBalance } from "@/services/getUSDCBalance";
import { Signer } from "@botanary/sdk/types";
import { useEffect, useState } from "react";
const { getSigner } = await import("../services/getClient");

export default function Home() {
  const [signer, setSigner] = useState<Signer | null>(null);
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    async function fetchUserInformation() {
      const signerInstance = await getSigner();
      setSigner(signerInstance);
      const balance = await getUSDCBalance(signerInstance.account.address);
      setBalance(balance);
    }
    fetchUserInformation();
  }, []);

  return <div>123</div>;
}
