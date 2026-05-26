/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { Upload, Trash2, Clipboard, FolderOpen } from "lucide-react";

interface JsonInputProps {
  value: string;
  onChange: (val: string) => void;
  onParse: () => void;
  onFormat: (spaces: number) => void;
  onMinify: () => void;
  onLoadSample: (type: "simple" | "nested" | "large" | "api" | "errors") => void;
  errorLine?: number | null;
}

export default function JsonInput({
  value,
  onChange,
  onParse,
  onFormat,
  onMinify,
  onLoadSample,
  errorLine = null,
}: JsonInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lineCount, setLineCount] = useState(1);

  // Synchronize line counts dynamically and align gutter scroll top
  useEffect(() => {
    const lines = value.split("\n").length;
    setLineCount(lines || 1);
    
    // Quick sync layout tick
    setTimeout(() => {
      if (textareaRef.current && gutterRef.current) {
        gutterRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    }, 0);
  }, [value]);

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Support Tab key indentation inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert 2 spaces
      const newValue = value.slice(0, start) + "  " + value.slice(end);
      onChange(newValue);

      // Reset caret position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Drag and Drop files handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileRead(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileRead(files[0]);
    }
  };

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        onChange(text);
      }
    };
    reader.readAsText(file);
  };

  // Read clipboard text
  const handlePasteFromClipboard = () => {
    navigator.clipboard.readText()
      .then((clipText) => {
        onChange(clipText);
      })
      .catch((_) => {
        // Fallback or silently fail if permission denied
      });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-[#080809] rounded-xl border border-neutral-200 dark:border-slate-800 p-4 transition-colors">
      
      {/* Upload & Sample templates bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {/* File input click triggering button */}
          <button
            type="button"
            id="btn-upload-file"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-emerald-400 bg-neutral-50 dark:bg-[#141417] border border-neutral-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg font-sans font-medium transition-colors cursor-pointer"
          >
            <FolderOpen size={13} />
            Open .json
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json,text/plain"
            className="hidden"
          />

          <button
            type="button"
            id="btn-paste-clipboard"
            onClick={handlePasteFromClipboard}
            className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-emerald-400 bg-neutral-50 dark:bg-[#141417] border border-neutral-200 dark:border-slate-800 px-2.5 py-1.5 rounded-lg font-sans font-medium transition-colors cursor-pointer"
          >
            <Clipboard size={13} />
            Paste
          </button>

          <button
            type="button"
            id="btn-top-clear"
            onClick={() => onChange("")}
            title="Clear workspace input"
            className="flex items-center gap-1.5 text-xs text-rose-650 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/15 dark:hover:bg-rose-950/35 border border-rose-200/55 dark:border-rose-900/25 px-2.5 py-1.5 rounded-lg font-sans font-medium transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            Clear
          </button>
        </div>

        {/* Utility Buttons replacing Samples */}
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            type="button"
            id="btn-top-minify"
            onClick={onMinify}
            title="Remove all whitespace"
            className="text-[11px] font-sans font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-800 transition-colors cursor-pointer"
          >
            Minify (Compact)
          </button>

          <button
            type="button"
            id="btn-top-format2"
            onClick={() => onFormat(2)}
            title="Format with 2-spaces indentation"
            className="text-[11px] font-sans font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-800 transition-colors cursor-pointer"
          >
            Format 2sp
          </button>

          <button
            type="button"
            id="btn-top-format4"
            onClick={() => onFormat(4)}
            title="Format with 4-spaces indentation"
            className="text-[11px] font-sans font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-800 transition-colors cursor-pointer"
          >
            Format 4sp
          </button>
        </div>
      </div>

      {/* Editor Space (Scroll and Drop Zone) */}
      <div 
        className={`flex-1 flex relative mt-3 rounded-xl overflow-hidden min-h-0 transition-all duration-150 ${
          isDragging 
            ? "border border-dashed border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 ring-4 ring-indigo-500/20" 
            : "border-0"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xs flex flex-col items-center justify-center pointer-events-none z-10 gap-3">
            <Upload size={32} className="text-indigo-500 animate-bounce" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 font-sans">Drop standard JSON file here</p>
            <p className="text-xs text-neutral-400 font-sans">Must be UTF-8 formatted markup</p>
          </div>
        )}

        {/* Text editor lines count gutter */}
        <div 
          ref={gutterRef}
          className="w-9 bg-neutral-50/70 dark:bg-[#0F0F11] border-r border-neutral-250 dark:border-slate-850 text-right select-none font-mono text-xs pr-2.5 py-4 text-neutral-300 dark:text-slate-600 leading-relaxed overflow-hidden h-full min-h-0"
        >
          {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => {
            const isErrorLine = errorLine === i + 1;
            return (
              <div 
                key={i}
                className={`transition-colors duration-150 ${
                  isErrorLine 
                    ? "text-rose-500 dark:text-rose-400 font-extrabold bg-rose-500/10 dark:bg-rose-500/20 border-r-2 border-rose-500 -mr-2.5 pr-2" 
                    : ""
                }`}
                title={isErrorLine ? "Syntax error around this line" : undefined}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Real Editor Monospace Area */}
        <textarea
          ref={textareaRef}
          id="json-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 bg-transparent font-mono text-xs p-4 focus:outline-hidden leading-relaxed text-neutral-800 dark:text-slate-200 min-h-0 w-full overflow-y-auto resize-none"
          //className="flex-1 bg-transparent font-mono text-xs p-4 focus:outline-hidden leading-relaxed text-neutral-800 dark:text-slate-200 min-h-0 h-full w-full overflow-y-auto resize-none"
          placeholder={`Paste JSON here or drop a file to begin...\n\ne.g.,\n{\n  "title": "Config",\n  "enabled": true\n}`}
        />
      </div>

    </div>
  );
}
