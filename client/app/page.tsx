"use client";

import { useState, useEffect } from "react";
import type { Message } from "../types/chat";
import Sidebar from "../components/Sidebar";
import Chat from "../components/Chat";
import { getSessionPrivateKey } from "@/utils/localStorage";

const BudgetChat = () => {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, text: "Hello! I'm your AI assistant. How can I help you today?", sender: "bot", cost: 0.0 }]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [sessionBudget, setSessionBudget] = useState(1.0);
  const [currentSpend, setCurrentSpend] = useState(0.0);
  const [stopOnLimit, setStopOnLimit] = useState(true);
  const [usdcPerPay, setUsdcPerPay] = useState(0.002);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [sessionPrivateKey, setSessionPrivateKey] = useState<string | null>(null);

  useEffect(() => {
    const sessionKey = getSessionPrivateKey();
    setSessionPrivateKey(sessionKey);
  }, []);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (stopOnLimit && currentSpend >= sessionBudget) {
      alert("Session budget limit reached! Please increase your budget to continue.");
      return;
    }

    const userMsgCost = inputText.length * usdcPerPay;

    const newUserMsg: Message = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      cost: userMsgCost,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setCurrentSpend((prev) => prev + userMsgCost);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponseText = generateMockResponse(newUserMsg.text);
      const botMsgCost = botResponseText.length * usdcPerPay;

      if (stopOnLimit && currentSpend + userMsgCost >= sessionBudget) {
        setIsTyping(false);
        const systemMsg: Message = {
          id: Date.now() + 1,
          text: "[SYSTEM]: Response blocked. Budget limit exceeded.",
          sender: "system",
          cost: 0,
        };
        setMessages((prev) => [...prev, systemMsg]);
        return;
      }

      const newBotMsg: Message = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: "bot",
        cost: botMsgCost,
      };

      setMessages((prev) => [...prev, newBotMsg]);
      setCurrentSpend((prev) => prev + botMsgCost);
      setIsTyping(false);
    }, 1500);
  };

  const generateMockResponse = (input: string) => {
    const responses = [
      "That's an interesting perspective. Could you elaborate on the financial implications?",
      "I can certainly help with that calculation. Here is a breakdown of the costs...",
      "Based on the data provided, the optimal strategy would be to diversify your allocation.",
      "Could you clarify what you mean by that? I want to ensure I'm using your tokens efficiently!",
      "Processing your request... This involves complex computation which might cost a few extra cents.",
      "The budget for this project seems feasible given the constraints you mentioned.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4 }).format(amount);
  };

  const isBudgetExceeded = currentSpend >= sessionBudget;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <Sidebar usdcPerPay={usdcPerPay} setUsdcPerPay={setUsdcPerPay} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <Chat
        messages={messages}
        inputText={inputText}
        setInputText={setInputText}
        handleSendMessage={handleSendMessage}
        isTyping={isTyping}
        isBudgetExceeded={isBudgetExceeded}
        stopOnLimit={stopOnLimit}
        setIsSidebarOpen={setIsSidebarOpen}
        hasSessionKey={!!sessionPrivateKey}
        costPerToken={usdcPerPay}
        currentSpend={currentSpend}
        formatMoney={formatMoney}
      />
    </div>
  );
};

export default BudgetChat;
