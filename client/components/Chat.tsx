"use client";

import React, { useEffect, useRef } from "react";
import type { Message } from "../types/chat";
import { Send, Menu, AlertTriangle } from "lucide-react";

interface ChatProps {
  messages: Message[];
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => Promise<void> | void;
  isTyping: boolean;
  isBudgetExceeded: boolean;
  stopOnLimit: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  hasSessionKey: boolean;
  costPerToken: number;
  currentSpend: number;
  formatMoney: (n: number) => string;
}

const Chat: React.FC<ChatProps> = ({ messages, inputText, setInputText, handleSendMessage, isTyping, isBudgetExceeded, stopOnLimit, setIsSidebarOpen, hasSessionKey, costPerToken, currentSpend, formatMoney }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLocked = !hasSessionKey || (isBudgetExceeded && stopOnLimit);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-slate-900 relative">
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-semibold text-white">Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isBudgetExceeded ? "bg-red-500" : "bg-emerald-500"}`}></span>
              <span className="text-xs text-slate-400">{isBudgetExceeded ? "Budget Exceeded" : "Active • Budget Protected"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.sender === "user" ? "self-end items-end" : "self-start items-start"}`}>
            <div
              className={`
                px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                ${
                  msg.sender === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : msg.sender === "system"
                    ? "bg-red-900/30 border border-red-500/50 text-red-200 w-full text-center"
                    : "bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-none"
                }
              `}
            >
              {msg.text}
            </div>

            {msg.sender !== "system" && (
              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-mono opacity-60 hover:opacity-100 transition-opacity">
                <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                {msg.cost > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center text-emerald-500/80">{msg.cost < 0.01 ? "<$0.01" : `$${msg.cost.toFixed(4)}`}</span>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-4 bg-slate-800/50 rounded-2xl rounded-tl-none self-start w-24">
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto relative">
          {!hasSessionKey && (
            <div className="absolute inset-0 bg-slate-900/95 z-30 flex items-center justify-center rounded-xl border border-slate-800/50">
              <div className="text-center">
                <h3 className="text-white font-medium text-sm">Session Key Required</h3>
                <p className="text-slate-400 text-xs mt-1 mb-3">Create your session key to enable the chat.</p>
              </div>
            </div>
          )}

          {isBudgetExceeded && stopOnLimit && hasSessionKey && (
            <div className="absolute inset-0 bg-slate-900/95 z-20 flex items-center justify-center rounded-xl border border-red-900/50">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 text-red-500 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-white font-medium text-sm">Session Budget Limit Reached</h3>
                <p className="text-slate-400 text-xs mt-1 mb-3">Increase your budget in settings to continue.</p>
                <button onClick={() => setIsSidebarOpen(true)} className="text-emerald-400 text-xs hover:underline">
                  Adjust Budget &rarr;
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className={`relative bg-slate-800 rounded-xl border border-slate-700 shadow-lg transition-all ${
              isLocked ? "opacity-20 blur-sm pointer-events-none" : "focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50"
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={!hasSessionKey ? "Add session key to enable chat" : isBudgetExceeded ? "Budget exceeded..." : "Type your message..."}
              disabled={isLocked}
              className="w-full bg-transparent text-white placeholder-slate-500 px-4 py-4 pr-14 rounded-xl outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLocked}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-slate-500">Estimated cost for this message: ~${(inputText.length * costPerToken || 0).toFixed(4)}</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Chat;
