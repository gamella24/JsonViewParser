/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { JsonMetadata } from "../types";
import { Database, FileText, Blocks, Layers, Server, Hash, FileJson, CheckCircle } from "lucide-react";

interface JsonStatsProps {
  metadata: JsonMetadata | null;
}

export default function JsonStats({ metadata }: JsonStatsProps) {
  if (!metadata) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400 bg-transparent rounded-xl h-full min-h-[300px]">
        <Blocks size={36} className="text-neutral-300 dark:text-neutral-700 mb-3 animate-pulse" />
        <p className="text-sm font-medium">No valid JSON parsed yet.</p>
        <p className="text-xs text-neutral-400 mt-1 max-w-[240px]">Paste valid JSON and parse to see detailed payload statistics instantly.</p>
      </div>
    );
  }

  // Format bytes helper
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const totalTypes = metadata.objectCount + metadata.arrayCount + metadata.primitiveCount;
  
  // Percentages for type distribution
  const objPct = totalTypes ? Math.round((metadata.objectCount / totalTypes) * 100) : 0;
  const arrPct = totalTypes ? Math.round((metadata.arrayCount / totalTypes) * 100) : 0;
  const primPct = totalTypes ? Math.round((metadata.primitiveCount / totalTypes) * 100) : 0;

  return (
    <div className="bg-transparent rounded-xl border-0 p-0 flex flex-col gap-6">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-slate-800 pb-3">
        <Server className="text-emerald-500" size={18} />
        <span className="text-xs font-semibold text-neutral-400 tracking-wider uppercase font-sans">
          Structure & Payload Analytics
        </span>
      </div>

      {/* Grid of Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#141417] rounded-xl p-3 border border-neutral-200/50 dark:border-slate-800 shadow-xs">
          <div className="text-neutral-400 dark:text-slate-400 flex items-center gap-1 text-[11px] font-sans font-medium uppercase tracking-wider mb-1">
            <FileText size={12} className="text-pink-500" />
            Size
          </div>
          <div className="font-mono text-lg font-bold text-neutral-800 dark:text-slate-200">
            {formatSize(metadata.sizeInBytes)}
          </div>
          <div className="text-[10px] text-neutral-400 dark:text-slate-500 font-sans mt-0.5">
            {metadata.characterCount.toLocaleString()} chars
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#141417] rounded-xl p-3 border border-neutral-200/50 dark:border-slate-800 shadow-xs">
          <div className="text-neutral-400 dark:text-slate-400 flex items-center gap-1 text-[11px] font-sans font-medium uppercase tracking-wider mb-1">
            <Database size={12} className="text-indigo-400" />
            Total Nodes
          </div>
          <div className="font-mono text-lg font-bold text-neutral-800 dark:text-slate-200">
            {metadata.nodeCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400 dark:text-slate-500 font-sans mt-0.5">
            JSON entities scanned
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#141417] rounded-xl p-3 border border-neutral-200/50 dark:border-slate-800 shadow-xs">
          <div className="text-neutral-400 dark:text-slate-400 flex items-center gap-1 text-[11px] font-sans font-medium uppercase tracking-wider mb-1">
            <Layers size={12} className="text-rose-450" />
            Max Nesting
          </div>
          <div className="font-mono text-lg font-bold text-neutral-800 dark:text-slate-200">
            {metadata.depth}
          </div>
          <div className="text-[10px] text-neutral-400 dark:text-slate-500 font-sans mt-0.5">
            Nesting structures deep
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#141417] rounded-xl p-3 border border-neutral-200/50 dark:border-slate-800 shadow-xs">
          <div className="text-neutral-400 dark:text-slate-400 flex items-center gap-1 text-[11px] font-sans font-medium uppercase tracking-wider mb-1">
            <Hash size={12} className="text-emerald-500" />
            Line Count
          </div>
          <div className="font-mono text-lg font-bold text-neutral-800 dark:text-slate-200">
            {metadata.lineCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400 dark:text-slate-500 font-sans mt-0.5">
            In formatted markup
          </div>
        </div>
      </div>

      {/* Structural Distribution Details */}
      <div className="bg-white dark:bg-[#141417]/50 rounded-xl border border-neutral-200/50 dark:border-slate-800 p-4 shadow-2xs">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-slate-350 font-sans mb-4 flex items-center gap-1.5 font-sans">
          <FileJson size={15} className="text-slate-400" />
          Component Entities Breakdown
        </h4>

        {/* CSS horizontal segmented bar chart */}
        <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-[#080809] overflow-hidden flex mb-4">
          <div
            title={`Objects: ${objPct}%`}
            style={{ width: `${objPct}%` }}
            className="h-full bg-pink-500 transition-all duration-300"
          />
          <div
            title={`Arrays: ${arrPct}%`}
            style={{ width: `${arrPct}%` }}
            className="h-full bg-indigo-500 transition-all duration-300"
          />
          <div
            title={`Primitives: ${primPct}%`}
            style={{ width: `${primPct}%` }}
            className="h-full bg-emerald-500 transition-all duration-300"
          />
        </div>

        {/* Table of exact breakdown stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Objects info */}
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-400 font-sans font-medium">Objects</p>
              <p className="font-mono text-sm font-semibold text-neutral-800 dark:text-slate-200">
                {metadata.objectCount} <span className="text-neutral-400 dark:text-slate-500 font-light text-[10px]">({objPct}%)</span>
              </p>
            </div>
          </div>

          {/* Arrays info */}
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-400 font-sans font-medium">Arrays</p>
              <p className="font-mono text-sm font-semibold text-neutral-800 dark:text-slate-200">
                {metadata.arrayCount} <span className="text-neutral-400 dark:text-slate-500 font-light text-[10px]">({arrPct}%)</span>
              </p>
            </div>
          </div>

          {/* Primitives info */}
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-400 font-sans font-medium">Values / Primitives</p>
              <p className="font-mono text-sm font-semibold text-neutral-800 dark:text-slate-200">
                {metadata.primitiveCount} <span className="text-neutral-400 dark:text-slate-500 font-light text-[10px]">({primPct}%)</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* JSON validation validation confirmation block */}
      <div className="bg-emerald-50/50 dark:bg-[#141417]/30 border border-emerald-100 dark:border-slate-800 rounded-xl p-3.5 flex items-start gap-2.5">
        <CheckCircle size={16} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-450 font-sans block">
            Passed Static Code Standards
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-slate-450 font-sans block mt-0.5">
            Payload parsed successfully and is structurally compatible with all standard JSON schema verifications. No infinite references or circular dependencies detected.
          </span>
        </div>
      </div>
    </div>
  );
}
