"use client";

import React, { useEffect, useState } from "react";
import { Wallet, Settings, DollarSign, RefreshCw, X, Lock, Unlock, CheckCircle2 } from "lucide-react";
import { getSigner } from "../services/getClient";
import { getUSDCBalance } from "@/services/getUSDCBalance";
import { createSessionKey, approveSessionKey, revokeSessionKey, usingSessionKey } from "@/services/sessionKey";
import { getSessionPrivateKey, getSessionPublicKey, getUsdcPerPay, storeUsdcPerPay } from "@/utils/localStorage";
import { Hex } from "viem";
import { Signer } from "@botanary/sdk/types";
import { privateKeyToAccount } from "viem/accounts";
import { sendDeployTransaction } from "@/services/sendUserOperation";

interface SidebarProps {
  usdcPerPay: number;
  setUsdcPerPay: React.Dispatch<React.SetStateAction<number>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ usdcPerPay, setUsdcPerPay, isSidebarOpen, setIsSidebarOpen }) => {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<Hex | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [sessionPublicKey, setSessionPublicKey] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const truncate = (addr: string) => {
    if (!addr) return addr;
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  useEffect(() => {
    async function fetchBalance() {
      if (connected && walletAddress) {
        const balance = await getUSDCBalance(walletAddress);
        setBalance(balance);
      } else {
        setBalance(null);
      }
    }
    fetchBalance();
    const spk = getSessionPublicKey();
    if (spk) setSessionPublicKey(spk as string);
  }, [connected]);

  const connectWallet = async () => {
    try {
      const signer = await getSigner();
      const address = signer?.account.address;

      if (address) {
        setWalletAddress(address as Hex);
        setConnected(true);
      }
    } catch (err: any) {
      alert(err?.message ?? String(err));
    }
  };

  const handleCreateAndApprove = async () => {
    try {
      setCreating(true);
      const sessionAddr = await createSessionKey();
      setSessionPublicKey(String(sessionAddr));
      storeUsdcPerPay(String(usdcPerPay));
      setCreating(false);

      const signer = await getSigner();
      setApproving(true);
      await approveSessionKey(signer as Signer, sessionAddr as Hex, String(usdcPerPay));
      await usingSessionKey();
      setApproving(false);

      if (walletAddress) {
        const b = await getUSDCBalance(walletAddress);
        setBalance(b);
      }
      alert("Session key created and approved successfully.");
    } catch (err: any) {
      setCreating(false);
      setApproving(false);
      alert(err?.message ?? String(err));
    }
  };

  const handleRevoke = async () => {
    const pk = getSessionPublicKey();
    if (!pk) {
      alert("No session key to revoke.");
      return;
    }
    try {
      const signer = await getSigner();
      setRevoking(true);
      await revokeSessionKey(signer as Signer, pk as Hex);
      setRevoking(false);
      localStorage.removeItem("sessionPrivateKey");
      localStorage.removeItem("usdcPerPay");
      setSessionPublicKey(null);
      alert("Session revoked");
    } catch (err: any) {
      setRevoking(false);
      alert(err?.message ?? String(err));
    }
  };

  const disconnect = () => {
    setConnected(false);
    setWalletAddress(null);
    setBalance(null);
  };

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-80 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col shadow-xl font-sans
      `}
    >
      {/* Header / Wallet Connection */}
      <div className="p-6 border-b border-slate-700 flex items-center justify-center">
        <div className="flex items-center justify-center gap-3 w-full">
          {walletAddress ? (
            <div className="flex items-center justify-between w-full bg-slate-900/50 border border-slate-700 px-3 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="font-mono text-xs text-emerald-300">{truncate(walletAddress)}</span>
              </div>
              <button onClick={disconnect} className="text-xs text-slate-400 hover:text-red-400 transition-colors" title="Disconnect">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl text-sm shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]"
            >
              <Wallet className="w-4 h-4 text-white/90" />
              Connect Wallet
            </button>
          )}

          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-2 rounded-md">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Balance Card */}
        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700 relative overflow-hidden group">
          <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-300 ${sessionPublicKey ? "bg-emerald-500" : "bg-slate-600"}`}></div>
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-12 h-12 text-white" />
          </div>

          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Account Balance</h3>
          <div className="text-3xl font-mono font-bold text-white mb-1">
            {balance ? balance : "0.00"} <span className="text-sm text-slate-500 font-sans font-normal">USDC</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
            <span>Session Status:</span>
            <span className={`font-mono ${sessionPublicKey ? "text-emerald-400" : "text-slate-500"}`}>{sessionPublicKey ? "Active" : "Inactive"}</span>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Session Configuration
          </h3>

          <div className="space-y-6 pt-2">
            {/* Cost Per Pay Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-xs text-slate-400">Cost per Pay </label>
                <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">${usdcPerPay.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.001"
                max={balance ? Math.max(parseFloat(balance), 0.01).toString() : "0"}
                step="0.001"
                value={usdcPerPay}
                onChange={(e) => setUsdcPerPay(parseFloat(e.target.value))}
                disabled={!!sessionPublicKey}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${sessionPublicKey ? "bg-slate-700 accent-slate-500" : "bg-slate-700 accent-emerald-500"}`}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-700 mt-4">
              {!sessionPublicKey ? (
                <button
                  onClick={handleCreateAndApprove}
                  disabled={creating || approving || !walletAddress}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                    ${!walletAddress || creating || approving ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"}
                  `}
                >
                  {creating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Creating Key...
                    </>
                  ) : approving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Approving...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Create and Approve
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <span className="text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Session Approved
                    </span>
                    <span className="text-slate-400 font-mono">{getUsdcPerPay() ?? usdcPerPay} / msg</span>
                  </div>
                  <button
                    onClick={handleRevoke}
                    disabled={revoking}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    {revoking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                    {revoking ? "Revoking..." : "Revoke Session"}
                  </button>
                </div>
              )}

              {!walletAddress && <p className="text-[10px] text-center text-slate-500 mt-2">Connect wallet to manage sessions</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-850 text-xs text-slate-500 text-center border-t border-slate-800">BudgetChat v1.0.4 &bull; Sidebar Component</div>
    </aside>
  );
};

export default Sidebar;
