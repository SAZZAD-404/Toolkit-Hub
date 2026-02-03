"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Copy, Check, Share2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface ToolInterfaceProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  inputPlaceholder: string;
  buttonText: string;
  onProcess: (input: string) => Promise<string>;
  resultLabel?: string;
  inputType?: "text" | "textarea" | "file";
}

/**
 * A premium, reusable interface for AI tools.
 * Features a glassmorphism design with sleek animations and responsive layout.
 */
export default function ToolInterface({
  title,
  description,
  icon,
  inputPlaceholder,
  buttonText,
  onProcess,
  resultLabel = "Result",
  inputType = "textarea",
}: ToolInterfaceProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      const output = await onProcess(input);
      setResult(output);
      
      // Increment "Total Executions" stat in real-time
      const { data: stats } = await supabase
        .from('dashboard_stats')
        .select('value')
        .eq('label', 'Total Executions')
        .single();
      
      if (stats) {
        const currentValue = parseFloat(stats.value.replace('K', '')) || 0;
        const newValue = (currentValue + 0.01).toFixed(1) + 'K';
        await supabase
          .from('dashboard_stats')
          .update({ value: newValue })
          .eq('label', 'Total Executions');
      }
    } catch (error) {
      console.error("Error processing tool:", error);
      setResult("An error occurred while processing your request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Tool Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
            {icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
            <p className="text-zinc-400 max-w-lg leading-relaxed">{description}</p>
          </div>
        </div>
      </div>

      {/* Tool Body */}
      <div className="grid grid-cols-1 gap-8">
        {/* Input Section */}
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Input</h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <Sparkles size={12} className="text-violet-400" />
              AI Powered
            </div>
          </div>

          {inputType === "textarea" ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full h-48 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none leading-relaxed"
            />
          ) : (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            />
          )}

          <button
            onClick={handleProcess}
            disabled={isProcessing || !input.trim()}
            className={cn(
              "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3",
              isProcessing || !input.trim()
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98]"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles size={20} className="fill-current" />
                {buttonText}
              </>
            )}
          </button>
        </div>

        {/* Result Section */}
        {result && (
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{resultLabel}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </button>
                <button className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all">
                  <Download size={18} />
                </button>
                <button className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            <div className="w-full min-h-[150px] bg-black/20 border border-white/[0.04] rounded-2xl p-6 text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
