/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Braces, FolderTree, BarChart3, ShieldCheck, AlertTriangle, CheckCircle2, Sun, Moon, Info, Search, ArrowRight, Keyboard, X, Shuffle } from "lucide-react";
import JsonInput from "./components/JsonInput";
import JsonTree from "./components/JsonTree";
import JsonStats from "./components/JsonStats";
import JsonCodeView from "./components/JsonCodeView";
import {
  parseJsonWithErrorDetails,
  autoFixJson,
  formatJson,
  minifyJson,
  computeJsonMetadata,
  getSampleJson,
  shuffleJson
} from "./utils/jsonUtils";
import { JsonMetadata, JsonParseError } from "./types";

export default function App() {
  const [rawText, setRawText] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState<JsonParseError | null>(null);
  const [formattedText, setFormattedText] = useState("");
  const [activeTab, setActiveTab] = useState<"formatted" | "tree" | "stats">("formatted");
  const [searchQuery, setSearchQuery] = useState("");
  const [metadata, setMetadata] = useState<JsonMetadata | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Sync theme to document body
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  // Global Keyboard Shortcuts Event Handler
  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      const isFormat = 
        (e.altKey && e.shiftKey && e.key.toLowerCase() === "f") ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f") ||
        (e.metaKey && e.shiftKey && e.key.toLowerCase() === "f");

      const isMinify = 
        (e.altKey && e.shiftKey && e.key.toLowerCase() === "m") ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "m") ||
        (e.metaKey && e.shiftKey && e.key.toLowerCase() === "m");

      const isClear = e.altKey && e.shiftKey && e.key.toLowerCase() === "c";
      const isSample = e.altKey && e.shiftKey && e.key.toLowerCase() === "s";
      const isParse = (e.ctrlKey || e.metaKey) && e.key === "Enter";
      const isToggleHelp = e.altKey && e.key === "/";
      const isEscape = e.key === "Escape";

      if (isFormat) {
        e.preventDefault();
        handleFormatSpacing(2);
      } else if (isMinify) {
        e.preventDefault();
        handleMinifyInput();
      } else if (isClear) {
        e.preventDefault();
        setRawText("");
      } else if (isSample) {
        e.preventDefault();
        handleLoadSample("nested");
      } else if (isParse) {
        e.preventDefault();
        handleParseAndFormat();
      } else if (isToggleHelp) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (isEscape) {
        setShowShortcutsModal(false);
        setShowPrivacyModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDownGlobal);
    return () => {
      window.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, [rawText, activeTab, darkMode]);



  // Auto-validate and parse raw text input changes (with a slight 150ms debounce for peak typing & pasting responsiveness)
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedData(null);
      setParseError(null);
      setFormattedText("");
      setMetadata(null);
      return;
    }

    const timer = setTimeout(() => {
      const result = parseJsonWithErrorDetails(rawText);
      if (result.success) {
        setParsedData(result.data);
        setParseError(null);
        
        const formatted = formatJson(result.data, 2);
        setFormattedText(formatted);
        
        // Update statistics
        const stats = computeJsonMetadata(result.data, formatted);
        setMetadata(stats);
      } else {
        setParsedData(null);
        setParseError(result.error || { message: "Parsing failed" });
        setMetadata(null);
      }
    }, 150); // 150ms debounce

    return () => clearTimeout(timer);
  }, [rawText]);

  // Parse and process current raw input content (Manual Trigger)
  const handleParseAndFormat = () => {
    const result = parseJsonWithErrorDetails(rawText);
    
    if (result.success) {
      setParsedData(result.data);
      setParseError(null);
      
      const formatted = formatJson(result.data, 2);
      setFormattedText(formatted);
      
      // Update statistics
      const stats = computeJsonMetadata(result.data, formatted);
      setMetadata(stats);

      // Trigger high contrast visual success indicators
      setIsSuccessFeedback(true);
      setTimeout(() => setIsSuccessFeedback(false), 2000);
    } else {
      setParsedData(null);
      setParseError(result.error || { message: "Parsing failed" });
      setMetadata(null);
    }
  };

  // Trigger quick spacing/tabs formatting directly on the input area
  const handleFormatSpacing = (spaces: number) => {
    const parseResult = parseJsonWithErrorDetails(rawText);
    if (parseResult.success) {
      const reformatted = formatJson(parseResult.data, spaces);
      setRawText(reformatted);
      setParsedData(parseResult.data);
      setFormattedText(reformatted);
      setParseError(null);

      const stats = computeJsonMetadata(parseResult.data, reformatted);
      setMetadata(stats);
      
      setIsSuccessFeedback(true);
      setTimeout(() => setIsSuccessFeedback(false), 1500);
    } else {
      setParseError(parseResult.error || { message: "Cannot format invalid JSON" });
    }
  };

  // Minify input action
  const handleMinifyInput = () => {
    const parseResult = parseJsonWithErrorDetails(rawText);
    if (parseResult.success) {
      const minified = minifyJson(parseResult.data);
      setRawText(minified);
      setParsedData(parseResult.data);
      setFormattedText(minified);
      setParseError(null);
      
      const stats = computeJsonMetadata(parseResult.data, minified);
      setMetadata(stats);

      setIsSuccessFeedback(true);
      setTimeout(() => setIsSuccessFeedback(false), 1500);
    } else {
      setParseError(parseResult.error || { message: "Cannot minify invalid JSON" });
    }
  };

  // Smart heuristic syntactical repair trigger
  const handleAutoFixSyntax = () => {
    const repaired = autoFixJson(rawText);
    setRawText(repaired);
    
    // Automatically attempt validation right after repairing
    const parseResult = parseJsonWithErrorDetails(repaired);
    if (parseResult.success) {
      setParsedData(parseResult.data);
      setParseError(null);
      const formatted = formatJson(parseResult.data, 2);
      setFormattedText(formatted);
      const stats = computeJsonMetadata(parseResult.data, formatted);
      setMetadata(stats);
    }
  };

  // Clear workspace or load specific preset schemas template
  const handleLoadSample = (type: "simple" | "nested" | "large" | "api" | "errors") => {
    const sample = getSampleJson(type);
    setRawText(sample);
    
    const result = parseJsonWithErrorDetails(sample);
    if (result.success) {
      setParsedData(result.data);
      setParseError(null);
      const formatted = formatJson(result.data, 2);
      setFormattedText(formatted);
      const stats = computeJsonMetadata(result.data, formatted);
      setMetadata(stats);
    } else {
      setParsedData(null);
      setParseError(result.error || null);
      setMetadata(null);
    }
  };

  // Perform structured in-memory random shuffle of JSON keys and arrays
  const handleShuffleJson = () => {
    if (!parsedData) return;
    try {
      const shuffled = shuffleJson(parsedData);
      setParsedData(shuffled);
      
      const formatted = formatJson(shuffled, 2);
      setRawText(formatted);
      setFormattedText(formatted);
      setParseError(null);
      
      const stats = computeJsonMetadata(shuffled, formatted);
      setMetadata(stats);
      
      // Flash elegant success state feedback
      setIsSuccessFeedback(true);
      setTimeout(() => setIsSuccessFeedback(false), 1200);
    } catch (err) {
      console.error("Failed to shuffle JSON:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] text-neutral-800 dark:text-slate-300 transition-colors flex flex-col font-sans">
      
      {/* Header bar */}
      <header className="border-b border-neutral-200 dark:border-slate-800 bg-white dark:bg-[#0F0F11] h-14 sticky top-0 z-30 transition-colors flex items-center">
        <div className="px-4 md:px-6 w-full flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <Braces size={18} className="text-emerald-500 dark:text-emerald-400 stroke-[2.5] shrink-0 select-none" />
            <div>
              <h1 className="text-xs font-bold tracking-widest uppercase text-slate-900 dark:text-slate-200">
                JSON VIEW PARSER
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats indicator on the top header */}
            {metadata && (
              <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-wider font-medium text-neutral-500 dark:text-slate-400">
                <span className="text-emerald-500 dark:text-emerald-400 font-semibold">&bull; Valid JSON</span>
                <span>Chars: {metadata.characterCount.toLocaleString()}</span>
                <span>Lines: {metadata.lineCount.toLocaleString()}</span>
              </div>
            )}

            {/* Dark Mode switcher */}
            <button
              type="button"
              id="theme-switch-btn"
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-1.5 p-1.5 px-3 text-[11px] uppercase tracking-wider font-bold border border-neutral-250 dark:border-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md transition-all cursor-pointer"
              title="Toggle theme mode"
            >
              {darkMode ? (
                <>
                  <Sun size={12} className="text-amber-500" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon size={12} className="text-indigo-400" />
                  <span>Dark</span>
                </>
              )}
            </button>

            {/* Keyboard Shortcuts Cheatsheet HUD Trigger */}
            <button
              type="button"
              id="keyboard-shortcuts-btn"
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center gap-1.5 p-1.5 px-3 text-[11px] uppercase tracking-wider font-bold border border-neutral-250 dark:border-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md transition-all cursor-pointer"
              title="View Keyboard Shortcuts (Alt + /)"
            >
              <Keyboard size={12} className="text-emerald-500" />
              <span>Shortcuts</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full px-4 md:px-6 py-4 flex flex-col overflow-hidden">
        
        {/* Validation warning strip banner */}
        {parseError && (
          <div className="bg-rose-50 dark:bg-rose-950/25 border border-rose-200/50 dark:border-rose-900/40 rounded-xl p-4 flex items-start gap-3 shadow-2xs animate-fade-in">
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-rose-800 dark:text-rose-400 font-sans uppercase tracking-wider">
                Invalid JSON Syntax Detected
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 font-sans leading-relaxed">
                {parseError.message}
              </p>
              
              {/* Useful advice helper */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[11px] font-sans font-medium text-rose-600 dark:text-rose-400 bg-rose-100/55 dark:bg-rose-950/40 rounded px-2 py-0.5">
                  Recommendation:
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-sans">
                  Correct syntax errors such as unquoted keys, missing braces, or incorrect trailing commas.
                </p>
              </div>
            </div>
            
            {parseError.line && parseError.column && (
              <div className="text-xs font-mono bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-semibold rounded px-2 py-1 select-none">
                L: {parseError.line} | C: {parseError.column}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Split Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1">
          
          {/* Left panel wrapper - Workspace Input */}
          <section className="lg:col-span-5 h-[500px] lg:h-[780px] flex flex-col min-h-0">
            <div className="h-9 flex items-center justify-between mb-2 shrink-0">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-sans">
                Input
              </span>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-sans font-medium">
                {rawText.length.toLocaleString()} characters
              </span>
            </div>

            <JsonInput
              value={rawText}
              onChange={setRawText}
              onParse={handleParseAndFormat}
              onFormat={handleFormatSpacing}
              onMinify={handleMinifyInput}
              onLoadSample={handleLoadSample}
              errorLine={parseError?.line || null}
            />
          </section>

          {/* Middle separator division with Parse center button */}
          <div className="lg:col-span-1 flex flex-row lg:flex-col items-center justify-center p-2 lg:p-0 relative min-h-[75px] lg:min-h-0 select-none">
            {/* Parse Button */}
            <button
              type="button"
              id="center-validate-btn"
              onClick={handleParseAndFormat}
              className="relative flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 shadow-md shadow-emerald-600/30 dark:shadow-emerald-950/40 rounded-lg cursor-pointer transition-all z-10 select-none group whitespace-nowrap"
            >
              <span>Parse</span>
              <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5 max-lg:rotate-90" />
            </button>
          </div>

          {/* Right panel wrapper - Output Exploration */}
         <section className="lg:col-span-5 h-[500px] lg:h-[780px] flex flex-col min-h-0">
            <div className="h-9 flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-sans">
                  Output
                </span>
                {parsedData && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-705 border border-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 px-2.5 py-0.5 rounded-full font-sans uppercase font-bold tracking-wider animate-pulse">
                    Successfully Synced
                  </span>
                )}
              </div>
              
              {/* Dynamic Search filter (Visible in Pretty Print and Collapsible Tree) */}
              {(activeTab === "formatted" || activeTab === "tree") && (
                <div className="relative max-w-xs scale-90 origin-right animate-fade-in">
                  <Search size={12} className="absolute left-2.5 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    id="search-output-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeTab === "formatted" ? "Find in code..." : "Find in tree..."}
                    className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-hidden placeholder-neutral-400 border border-neutral-200 dark:border-neutral-700 w-44 focus:w-56 focus:border-emerald-500 transition-all font-sans"
                  />
                </div>
              )}
            </div>

            {/* Visualizer tabs panel */}
            <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-[#080809] rounded-xl border border-neutral-200 dark:border-slate-800 overflow-hidden shadow-xs">
              
              {/* Workspace Navigation Tabs list */}
              <div className="bg-neutral-50 dark:bg-[#141417] border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between px-3 shrink-0">
                <nav className="flex items-center gap-1.5 py-2.5" aria-label="Visualizer Tabs">
                  
                  {/* Tab 1 - Pretty print */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("formatted")}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg select-none transition-colors border cursor-pointer ${
                      activeTab === "formatted"
                        ? "bg-white dark:bg-[#080809] text-emerald-600 dark:text-emerald-400 border-neutral-250 dark:border-slate-850 shadow-3xs"
                        : "text-neutral-500 dark:text-slate-400 border-transparent hover:text-neutral-700 dark:hover:text-slate-200 hover:bg-neutral-200/40 dark:hover:bg-[#1C1C21]"
                     }`}
                  >
                    <Braces size={13} />
                    Pretty Print
                  </button>

                  {/* Tab 2 - Interactive tree */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("tree")}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg select-none transition-colors border cursor-pointer ${
                      activeTab === "tree"
                        ? "bg-white dark:bg-[#080809] text-emerald-600 dark:text-emerald-400 border-neutral-250 dark:border-slate-850 shadow-3xs"
                        : "text-neutral-500 dark:text-slate-400 border-transparent hover:text-neutral-700 dark:hover:text-slate-200 hover:bg-neutral-200/40 dark:hover:bg-[#1C1C21]"
                    }`}
                  >
                    <FolderTree size={13} />
                    Collapsible Tree
                  </button>

                  {/* Tab 3 - Statistics dashboard */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("stats")}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg select-none transition-colors border cursor-pointer ${
                      activeTab === "stats"
                        ? "bg-white dark:bg-[#080809] text-emerald-600 dark:text-emerald-400 border-neutral-250 dark:border-slate-850 shadow-3xs"
                        : "text-neutral-500 dark:text-slate-400 border-transparent hover:text-neutral-700 dark:hover:text-slate-200 hover:bg-neutral-200/40 dark:hover:bg-[#1C1C21]"
                    }`}
                  >
                    <BarChart3 size={13} />
                    Statistics
                  </button>

                </nav>


              </div>

              {/* Dynamic tab contents frame window */}
              <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                {activeTab === "formatted" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {parsedData ? (
                      <JsonCodeView formattedText={formattedText} searchQuery={searchQuery} onShuffle={handleShuffleJson} />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400 flex-1 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-slate-50/10 dark:bg-neutral-900/10">
                        <Braces size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Prettified JSON code view is currently empty.</span>
                        <p className="text-xs text-neutral-400 mt-1 max-w-xs font-sans">Solve parsing errors, input standard markup fields, or click "Validate & Parse" button on the left to show colorized code.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "tree" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {parsedData ? (
                      <JsonTree data={parsedData} searchQuery={searchQuery} />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400 flex-1 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-slate-50/10 dark:bg-neutral-900/10">
                        <FolderTree size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Interactive node tree view empty.</span>
                        <p className="text-xs text-neutral-400 mt-1 max-w-xs font-sans">Requires syntactically valid JSON. Enter markup details under the input panel to enable expandable nesting inspection.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "stats" && (
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <JsonStats metadata={metadata} />
                  </div>
                )}
              </div>

            </div>
          </section>

        </div>

      </main>

      {/* Footer credits bar */}
      <footer className="border-t border-neutral-200 dark:border-slate-800 mt-auto bg-white dark:bg-[#0F0F11] transition-colors py-4">
        <div className="w-full px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-widest text-neutral-400 dark:text-slate-500 font-sans text-center md:text-left">
          <span>Json View Parser &bull; Developed By RP</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-neutral-600 dark:hover:text-slate-350 hover:underline font-bold transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Keyboard Shortcuts Help HUD Overlay Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0E0E11] border border-neutral-250 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all animate-scale-up">
            <div className="border-b border-neutral-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between bg-neutral-50 dark:bg-[#141417]">
              <div className="flex items-center gap-2">
                <Keyboard size={16} className="text-emerald-500" />
                <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider font-sans">
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-neutral-500 dark:text-slate-400 font-sans leading-relaxed">
                Accelerate your parsing, styling, and indentation matching speed using standard command row hotkeys:
              </p>

              <div className="flex flex-col gap-2.5 font-sans">
                {/* Parse JSON */}
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-neutral-600 dark:text-slate-300 font-medium">Parse and Sync JSON</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Ctrl</kbd>
                    <span className="text-neutral-400 text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Enter</kbd>
                  </div>
                </div>

                {/* Format/Beautify (2 Spaces) */}
                <div className="flex items-center justify-between text-xs py-1 border-t border-neutral-100 dark:border-slate-850/40">
                  <span className="text-neutral-600 dark:text-slate-300 font-medium">Format JSON (2 spaces)</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Alt</kbd>
                    <span className="text-neutral-400 text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Shift</kbd>
                    <span className="text-neutral-400 text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">F</kbd>
                  </div>
                </div>

                {/* Minify JSON */}
                <div className="flex items-center justify-between text-xs py-1 border-t border-neutral-100 dark:border-slate-850/40">
                  <span className="text-neutral-600 dark:text-slate-300 font-medium">Minify JSON (Compact)</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Alt</kbd>
                    <span className="text-neutral-400 text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Shift</kbd>
                    <span className="text-neutral-400 text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">M</kbd>
                  </div>
                </div>

                {/* Clear Input Workspace */}
                <div className="flex items-center justify-between text-xs py-1 border-t border-neutral-100 dark:border-slate-850/40">
                  <span className="text-neutral-600 dark:text-slate-300 font-medium">Clear Workspace Input</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Alt</kbd>
                    <span className="text-neutral-400 text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Shift</kbd>
                    <span className="text-neutral-400 text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">C</kbd>
                  </div>
                </div>

                {/* Load Nested Sample JSON */}
                <div className="flex items-center justify-between text-xs py-1 border-t border-neutral-100 dark:border-slate-850/40">
                  <span className="text-neutral-600 dark:text-slate-300 font-medium">Load Template Sample</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Alt</kbd>
                    <span className="text-neutral-400 text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Shift</kbd>
                    <span className="text-neutral-400 text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">S</kbd>
                  </div>
                </div>

                {/* View/Hide Help overlay Shortcut */}
                <div className="flex items-center justify-between text-xs py-1 border-t border-neutral-100 dark:border-slate-850/40">
                  <span className="text-neutral-600 dark:text-slate-300 font-medium">Toggle Help Screen</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">Alt</kbd>
                    <span className="text-neutral-400 text-[10px]">+</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold font-mono bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 rounded-md border border-neutral-250 dark:border-slate-750 shadow-3xs">/</kbd>
                  </div>
                </div>
              </div>

              <div className="mt-2 bg-neutral-50 dark:bg-slate-900/40 rounded-xl p-3 border border-neutral-150 dark:border-slate-800 text-center text-[11px] font-sans text-neutral-500 dark:text-slate-400">
                Tip: Press <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-slate-800 rounded font-mono font-semibold text-neutral-700 dark:text-neutral-300">Esc</kbd> anytime to dismiss active overlays.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy HUD Overlay Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0E0E11] border border-neutral-250 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all animate-scale-up">
            <div className="border-b border-neutral-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between bg-neutral-50 dark:bg-[#141417]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                <h3 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider font-sans">
                  Privacy Policy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider font-sans text-left">
                100% Client-Side Protection
              </h4>
              <p className="text-xs text-neutral-500 dark:text-slate-400 font-sans leading-relaxed text-left">
                Your data security and privacy are fundamental priorities. The Json View Parser application operates entirely on your local machine using client-side technology.
              </p>

              <div className="flex flex-col gap-3 font-sans text-xs text-left">
                <div className="bg-neutral-50 dark:bg-slate-900/40 border border-neutral-150 dark:border-slate-800 rounded-xl p-3">
                  <h5 className="font-bold text-neutral-700 dark:text-slate-300 mb-1">No Data Transmission</h5>
                  <p className="text-neutral-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Any JSON strings, payload logs, server configurations, or code content paste or dragged into this site are handled exclusively in your web browser's local memory space. We never send, copy, or upload any of your structured data to external web servers, tracking pipelines, or analytics engines.
                  </p>
                </div>

                <div className="bg-neutral-50 dark:bg-slate-900/40 border border-neutral-150 dark:border-slate-800 rounded-xl p-3">
                  <h5 className="font-bold text-neutral-700 dark:text-slate-300 mb-1">Local Storage Sandbox</h5>
                  <p className="text-neutral-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Personalized options such as dark mode preference or search states may be saved inside your web browser's local sandboxed key-value storage (localStorage) for convenience. This stays on your desktop/mobile browser and can be cleared at any time.
                  </p>
                </div>

                <div className="bg-neutral-50 dark:bg-slate-900/40 border border-neutral-150 dark:border-slate-800 rounded-xl p-3">
                  <h5 className="font-bold text-neutral-700 dark:text-slate-300 mb-1">Compliance & Peace of Mind</h5>
                  <p className="text-neutral-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Because we do not run third-party databases or remote server functions, the application complies with all offline software security layouts, corporate environment rules, and modern strict consumer proxy setups.
                  </p>
                </div>
              </div>

              <div className="mt-1 pb-1 text-center">
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Understood, close policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
