/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef } from "react";
import { Copy, Download, Search, Check, FileJson, Shuffle } from "lucide-react";

interface JsonCodeViewProps {
  formattedText: string;
  searchQuery: string;
  onShuffle?: () => void;
}

export default function JsonCodeView({ formattedText, searchQuery, onShuffle }: JsonCodeViewProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Trigger temporary success state upon duplicating
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedText)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
  };

  // Safe client-side JSON downloading
  const handleDownload = () => {
    const blob = new Blob([formattedText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `parsed_data_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Production-grade JSON syntax highlighting parser
  const highlightedHtml = useMemo(() => {
    if (!formattedText) return "";

    // Escape raw HTML tags to guarantee script safety
    const escaped = formattedText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Regular expression matching JSON tokens: string keys, string values, numbers, booleans, null references
    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "text-amber-600 dark:text-amber-500 font-mono"; // defaults to number
        
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "text-pink-600 dark:text-pink-400 font-semibold font-mono"; // JSON Key
          } else {
            cls = "text-emerald-600 dark:text-emerald-400 font-mono break-all"; // JSON String Value
          }
        } else if (/true|false/.test(match)) {
          cls = "text-indigo-600 dark:text-indigo-400 font-semibold font-mono"; // JSON Boolean
        } else if (/null/.test(match)) {
          cls = "text-neutral-400 dark:text-slate-500 italic font-mono"; // JSON Null value
        }
        
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }, [formattedText]);

  // Master highlight handler that overlays the searchQuery yellow markings safely without disrupting HTML markup
  const finalHtml = useMemo(() => {
    if (!searchQuery?.trim()) return highlightedHtml;

    // Helper to escape regex special characters
    const escapeRegExp = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    const escapedQuery = escapeRegExp(searchQuery);
    const regex = new RegExp(`(${escapedQuery})`, "gi");

    // Split the syntax-highlighted HTML by tags so we only highlight matches in actual text nodes
    const parts = highlightedHtml.split(/(<[^>]+>)/g);
    
    const processedParts = parts.map((part) => {
      // If it looks like an HTML tag, don't modify it
      if (part.startsWith("<") && part.endsWith(">")) {
        return part;
      }
      
      // Otherwise, we perform our search-highlight replacement on this text node
      return part.replace(regex, (match) => {
        return `<mark class="bg-yellow-200 dark:bg-yellow-600/80 text-yellow-950 dark:text-white rounded-[3px] font-semibold px-0.5 shadow-xs transition-colors">${match}</mark>`;
      });
    });

    return processedParts.join("");
  }, [highlightedHtml, searchQuery]);

  // Handle live search matching within the formatted presentation
  const lines = useMemo(() => {
    return formattedText.split("\n");
  }, [formattedText]);

  return (
    <div className="flex flex-col h-full bg-transparent border-0 text-slate-800 dark:text-slate-300 font-mono select-text transition-colors">
      
      {/* Utilities Header panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-slate-800">
        
        {/* Statistics or file format specification */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-slate-400 font-sans">
          <FileJson size={13} className="text-zinc-400 dark:text-slate-400" />
          <span>Pretty Output</span>
        </div>

        {/* Action button row */}
        <div className="flex items-center gap-2">
          {onShuffle && (
            <button
              type="button"
              id="btn-shuffle-json"
              onClick={onShuffle}
              className="flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-800 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#141417] dark:hover:bg-[#1C1C21] text-neutral-700 dark:text-neutral-200 cursor-pointer select-none transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Shuffle JSON keys and array elements randomly"
            >
              <Shuffle size={12} className="text-emerald-500" />
              <span>Shuffle</span>
            </button>
          )}

          <button
            type="button"
            id="btn-copy-formatted"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-sans px-3 py-1.5 rounded-lg border cursor-pointer select-none transition-all ${
              copySuccess 
                ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300" 
                : "bg-neutral-50 hover:bg-neutral-100 dark:bg-[#141417] dark:hover:bg-[#1C1C21] text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-slate-800"
            }`}
          >
            {copySuccess ? <Check size={12} /> : <Copy size={12} />}
            {copySuccess ? "Copied!" : "Copy Code"}
          </button>

          <button
            type="button"
            id="btn-download-json"
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 border border-transparent px-3 py-1.5 rounded-lg font-sans font-medium hover:shadow-md transition-colors cursor-pointer"
          >
            <Download size={12} />
            Download
          </button>
        </div>

      </div>

      {/* Structured Code Scrolling Frame */}
      <div className="flex-1 flex relative mt-3 rounded-xl overflow-hidden min-h-0 border-0">
        
        {/* Indent line-numbers bar */}
        <div 
          ref={gutterRef}
          className="w-9 bg-neutral-50/70 dark:bg-[#0F0F11] border-r border-neutral-250 dark:border-slate-850 text-right select-none font-mono text-xs pr-2.5 py-4 text-neutral-300 dark:text-slate-600 leading-relaxed overflow-hidden h-full min-h-0 shrink-0 pointer-events-none"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Core Highlighter view */}
        <div 
          onScroll={handleScroll}
          className="flex-1 overflow-auto min-h-0 h-full w-full select-text"
        >
          <pre className="p-4 leading-relaxed font-mono text-xs text-neutral-800 dark:text-slate-200 select-text [color-scheme:dark] whitespace-pre-wrap break-all">
            <code
              dangerouslySetInnerHTML={{ __html: finalHtml }}
              className="select-text font-mono"
            />
          </pre>
        </div>

      </div>

    </div>
  );
}
