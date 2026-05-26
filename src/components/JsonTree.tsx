/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { Copy, ChevronRight, ChevronDown, Search, ArrowUp, ArrowDown } from "lucide-react";

interface JsonTreeProps {
  data: any;
  searchQuery: string;
}

export default function JsonTree({ data, searchQuery }: JsonTreeProps) {
  // We keep track of expanded paths globally in a state so we can easily toggle, expand all, or collapse all.
  // Paths are stored as strings (e.g., "root.users[0].name").
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({ "root": true });
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Auto-expand paths containing search matches
  useEffect(() => {
    if (!searchQuery?.trim()) return;
    
    const newPaths: Record<string, boolean> = { "root": true };
    const lowerQuery = searchQuery.toLowerCase();

    function traverseTreeAndExpand(node: any, currentPath: string): boolean {
      if (node === null) {
        return "null".includes(lowerQuery);
      }

      let isNodeMatch = false;

      if (typeof node !== "object") {
        isNodeMatch = String(node).toLowerCase().includes(lowerQuery);
        return isNodeMatch;
      }

      let hasChildMatch = false;

      if (Array.isArray(node)) {
        node.forEach((item, idx) => {
          const childPath = `${currentPath}[${idx}]`;
          const itemMatched = traverseTreeAndExpand(item, childPath);
          if (itemMatched) {
            hasChildMatch = true;
            newPaths[currentPath] = true;
          }
        });
      } else {
        Object.keys(node).forEach((key) => {
          const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? `.${key}` : `["${key}"]`;
          const childPath = `${currentPath}${safeKey}`;
          const keyMatched = key.toLowerCase().includes(lowerQuery);
          const valMatched = traverseTreeAndExpand(node[key], childPath);
          if (keyMatched || valMatched) {
            hasChildMatch = true;
            newPaths[currentPath] = true;
          }
        });
      }

      return isNodeMatch || hasChildMatch;
    }

    traverseTreeAndExpand(data, "root");
    setExpandedPaths((prev) => ({ ...prev, ...newPaths }));
  }, [searchQuery, data]);

  // Helper code to handle text copy feedback
  const triggerCopyFeedback = (message: string) => {
    setCopyFeedback(message);
    setTimeout(() => setCopyFeedback(null), 1800);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => triggerCopyFeedback(`Copied ${label}!`))
      .catch((_) => triggerCopyFeedback(`Failed to copy`));
  };

  // Helper for determining matches in JSON keys or values
  const hasSearchMatch = (key: string | number, value: any, query: string): boolean => {
    if (!query) return false;
    const lowerQuery = query.toLowerCase();
    
    // Check key
    if (String(key).toLowerCase().includes(lowerQuery)) return true;
    
    // Check primitive value
    if (value !== null && typeof value !== "object") {
      return String(value).toLowerCase().includes(lowerQuery);
    }
    
    return false;
  };

  // Check if a node contains any matching childrens down the tree
  const containsMatchInSubtree = useMemo(() => {
    const memo = new Map<any, boolean>();

    function check(val: any, q: string): boolean {
      if (!q) return false;
      if (val === null) return "null".includes(q.toLowerCase());
      
      if (typeof val !== "object") {
        return String(val).toLowerCase().includes(q.toLowerCase());
      }

      if (memo.has(val)) return memo.get(val)!;

      let match = false;
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          if (String(i).toLowerCase().includes(q.toLowerCase()) || check(val[i], q)) {
            match = true;
            break;
          }
        }
      } else {
        const keys = Object.keys(val);
        for (let i = 0; i < keys.length; i++) {
          const k = keys[i];
          if (k.toLowerCase().includes(q.toLowerCase()) || check(val[k], q)) {
            match = true;
            break;
          }
        }
      }

      memo.set(val, match);
      return match;
    }

    return (nodeVal: any) => check(nodeVal, searchQuery);
  }, [searchQuery]);

  // Recursively expand all paths matching a search query
  const handleToggleAll = (expand: boolean) => {
    if (!expand) {
      setExpandedPaths({ "root": true });
      return;
    }

    const newPaths: Record<string, boolean> = {};
    
    function traverse(node: any, currentPath: string) {
      newPaths[currentPath] = true;
      if (node === null || typeof node !== "object") return;

      if (Array.isArray(node)) {
        node.forEach((item, idx) => {
          traverse(item, `${currentPath}[${idx}]`);
        });
      } else {
        Object.keys(node).forEach((key) => {
          const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? `.${key}` : `["${key}"]`;
          traverse(node[key], `${currentPath}${safeKey}`);
        });
      }
    }

    traverse(data, "root");
    setExpandedPaths(newPaths);
  };

  // Helper component to render nested JSON nodes
  const TreeNode = ({
    val,
    nodeKey,
    currentPath,
    isLast
  }: {
    val: any;
    nodeKey: string | number;
    currentPath: string;
    isLast: boolean;
    key?: React.Key;
  }) => {
    const isExpanded = expandedPaths[currentPath] ?? false;
    const isObject = val !== null && typeof val === "object";
    const isArr = Array.isArray(val);

    const toggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedPaths((prev) => ({
        ...prev,
        [currentPath]: !prev[currentPath],
      }));
    };

    // Calculate highlights for keys & values if search active
    const keyStr = String(nodeKey);
    const lowercaseQuery = searchQuery.toLowerCase();
    const isKeyMatch = searchQuery ? keyStr.toLowerCase().includes(lowercaseQuery) : false;

    // Helper for highlighted search text rendering
    const renderHighlight = (text: string, isMatch: boolean) => {
      if (!isMatch || !searchQuery) return <span>{text}</span>;
      const index = text.toLowerCase().indexOf(lowercaseQuery);
      if (index === -1) return <span>{text}</span>;

      return (
        <span>
          {text.substring(0, index)}
          <span className="bg-yellow-100 text-yellow-900 font-semibold px-0.5 rounded shadow-xs dark:bg-yellow-600 dark:text-white">
            {text.substring(index, index + searchQuery.length)}
          </span>
          {text.substring(index + searchQuery.length)}
        </span>
      );
    };

    // Subtree searching indicator
    const hasMatchBelow = searchQuery ? containsMatchInSubtree(val) : false;

    // Direct match here
    const isDirectMatch = searchQuery && hasSearchMatch(nodeKey, val, searchQuery);

    // Dynamic classes to highlight matches or ancestors
    let containerClass = "group relative flex flex-col font-mono text-sm py-1 pl-4 rounded-sm transition-colors ";
    if (isDirectMatch) {
      containerClass += "bg-emerald-50/70 border-l-2 border-emerald-400 dark:bg-emerald-950/20";
    } else if (hasMatchBelow) {
      containerClass += "bg-indigo-50/20 dark:bg-indigo-950/5";
    } else {
      containerClass += "hover:bg-gray-50/50 dark:hover:bg-neutral-800/20";
    }

    // Node is standard primitives
    if (!isObject) {
      let valueColor = "text-amber-600 dark:text-amber-500";
      let formattedVal = String(val);

      if (typeof val === "string") {
        valueColor = "text-emerald-600 dark:text-emerald-400";
        formattedVal = `"${val}"`;
      } else if (typeof val === "boolean") {
        valueColor = "text-indigo-650 dark:text-indigo-400 font-semibold";
      } else if (val === null) {
        valueColor = "text-neutral-400 dark:text-slate-500 italic";
        formattedVal = "null";
      } else if (typeof val === "number") {
        valueColor = "text-amber-600 dark:text-amber-500";
      }

      const isValMatch = searchQuery && String(val).toLowerCase().includes(lowercaseQuery);

      return (
        <div className={containerClass}>
          <div className="flex items-baseline flex-wrap gap-x-1.5">
            {/* Key */}
            {typeof nodeKey === "string" ? (
              <span className="text-pink-600 dark:text-pink-400 font-semibold select-all">
                {renderHighlight(keyStr, isKeyMatch)}:
              </span>
            ) : (
              <span className="text-indigo-500 dark:text-indigo-400 select-all font-semibold">
                [{nodeKey}]:
              </span>
            )}

            {/* Primitive Value */}
            <span className={`${valueColor} break-all select-all whitespace-pre-wrap`}>
              {typeof val === "string" 
                ? renderHighlight(formattedVal, isValMatch) 
                : renderHighlight(formattedVal, isValMatch)}
            </span>

            {/* Trailing Comma */}
            {!isLast && <span className="text-neutral-400">,</span>}

            {/* Action buttons (only show on hover to keep interface clean) */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 ml-3 bg-white/90 dark:bg-neutral-900/90 shadow-sm border border-neutral-200/60 dark:border-neutral-800 rounded px-1 py-0.2 scale-95 origin-left transition-all duration-150 inline-flex">
              <button
                type="button"
                id={`copy-val-${currentPath}`}
                onClick={() => copyToClipboard(typeof val === "string" ? val : String(val), "value")}
                title="Copy raw value"
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
              >
                <Copy size={11} />
              </button>
              <button
                type="button"
                id={`copy-path-${currentPath}`}
                onClick={() => copyToClipboard(currentPath.replace(/^root/, "$"), "parent path")}
                title="Copy relative JSON path"
                className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 px-1 hover:underline"
              >
                Copy Path
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Node is an Object or Array
    const keys = isArr ? [] : Object.keys(val);
    const size = isArr ? val.length : keys.length;
    const isEmpty = size === 0;

    return (
      <div className={containerClass}>
        <div className="flex items-center flex-wrap cursor-pointer select-none" onClick={toggleExpand}>
          {/* Collapse/Expand Arrow */}
          {!isEmpty && (
            <button
              type="button"
              id={`toggle-node-${currentPath}`}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 mr-1 p-0.5 rounded focus:outline-hidden"
            >
              {isExpanded ? <ChevronDown size={14} className="text-neutral-500" /> : <ChevronRight size={14} />}
            </button>
          )}

          {/* Key */}
          {typeof nodeKey === "string" ? (
            <span className="text-pink-600 dark:text-pink-400 font-semibold mr-1 select-all hover:underline">
              {renderHighlight(keyStr, isKeyMatch)}:
            </span>
          ) : (
            <span className="text-indigo-500 dark:text-indigo-400 select-all hover:underline mr-1 font-semibold">
              [{nodeKey}]:
            </span>
          )}

          {/* Type Badge and length */}
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-light flex items-center gap-1">
            <span>{isArr ? "Array" : "Object"}</span>
            <span className="bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 rounded-sm px-1 py-0.2 scale-90">
              {size} item{size !== 1 && "s"}
            </span>
            {hasMatchBelow && searchQuery && (
              <span className="ml-1 px-1 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400 rounded text-[10px] uppercase font-bold tracking-wider">
                Matches inside
              </span>
            )}
          </span>

          {/* Collapsed view placeholder */}
          {!isExpanded || isEmpty ? (
            <span className="text-neutral-400 ml-1.5 select-none font-sans text-xs">
              {isArr ? "[ ... ]" : "{ ... }"}
              {!isLast && ","}
            </span>
          ) : null}

          {/* Subtree actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-4 bg-white/90 dark:bg-neutral-900/90 shadow-sm border border-neutral-200/60 dark:border-neutral-800 rounded px-1 py-0.2 scale-95 origin-left transition-all duration-150 invisible sm:inline-flex">
            <button
              type="button"
              id={`copy-subjson-${currentPath}`}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(JSON.stringify(val, null, 2), "JSON payload");
              }}
              title="Copy sub-JSON tree"
              className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1 px-1"
            >
              <Copy size={10} /> Copy value
            </button>
            <button
              type="button"
              id={`copy-path-obj-${currentPath}`}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(currentPath.replace(/^root/, "$"), "path");
              }}
              className="text-[11px] text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 px-1 hover:underline"
            >
              Copy Path
            </button>
          </div>
        </div>

        {/* Child items if expanded */}
        {!isEmpty && isExpanded ? (
          <div className="border-l border-neutral-200/60 dark:border-neutral-800/80 pl-2 ml-2 mt-1 flex flex-col gap-0.5">
            {isArr
              ? val.map((item: any, idx: number) => (
                  <TreeNode
                    key={idx}
                    val={item}
                    nodeKey={idx}
                    currentPath={`${currentPath}[${idx}]`}
                    isLast={idx === val.length - 1}
                  />
                ))
              : keys.map((key, idx) => {
                  const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? `.${key}` : `["${key}"]`;
                  return (
                    <TreeNode
                      key={key}
                      val={val[key]}
                      nodeKey={key}
                      currentPath={`${currentPath}${safeKey}`}
                      isLast={idx === keys.length - 1}
                    />
                  );
                })}
          </div>
        ) : null}

        {/* Closing trailing symbol for expanded state */}
        {isExpanded && !isEmpty && (
          <div className="text-neutral-400 font-mono text-xs pl-4 select-none mt-0.5">
            {isArr ? "]" : "}"}
            {!isLast && ","}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-transparent border-0 text-slate-850 dark:text-slate-300">
      {/* Control row for expanding/collapsing all nodes */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-neutral-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-neutral-400 tracking-wider uppercase font-sans">
          Interactive Node Tree
        </span>
        
        <div className="flex items-center gap-2">
          {/* Global Copy feedback toaster alert inside the view */}
          {copyFeedback && (
            <div className="bg-emerald-500 text-white font-medium text-xs rounded-full px-3 py-1 shadow-md max-w-sm animate-fade-in whitespace-nowrap transition-all">
              {copyFeedback}
            </div>
          )}

          <button
            type="button"
            id="btn-tree-expand-all"
            onClick={() => handleToggleAll(true)}
            className="flex items-center gap-1 text-xs text-neutral-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-emerald-400 bg-neutral-50 dark:bg-[#141417] border border-neutral-200 dark:border-slate-800 px-2.5 py-1 rounded-lg shadow-2xs transition-colors duration-150 font-sans cursor-pointer font-medium"
          >
            <ArrowDown size={12} />
            Expand All
          </button>
          <button
            type="button"
            id="btn-tree-collapse-all"
            onClick={() => handleToggleAll(false)}
            className="flex items-center gap-1 text-xs text-neutral-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-emerald-400 bg-neutral-50 dark:bg-[#141417] border border-neutral-200 dark:border-slate-800 px-2.5 py-1 rounded-lg shadow-2xs transition-colors duration-150 font-sans cursor-pointer font-medium"
          >
            <ArrowUp size={12} />
            Collapse All
          </button>
        </div>
      </div>

      {searchQuery && (
        <div className="text-xs text-neutral-550 dark:text-slate-400 bg-neutral-100 dark:bg-[#141417] border border-neutral-200 dark:border-slate-800 px-3 py-1.5 rounded-lg mb-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Search size={12} className="text-indigo-500 dark:text-indigo-450" />
            Showing search matches in the tree. Matching keys/values are highlighted.
          </span>
        </div>
      )}

      {/* Main scrolling viewport container for the parsed JSON Tree */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="p-1 select-none flex flex-col gap-1">
          {data === null || typeof data !== "object" ? (
            <TreeNode val={data} nodeKey="root" currentPath="root" isLast={true} />
          ) : Array.isArray(data) ? (
            <div className="text-neutral-400 dark:text-slate-500 font-mono text-sm">[
              <div className="border-l border-neutral-250 dark:border-slate-850 pl-2 ml-2 mt-1">
                {data.map((item, idx) => (
                  <TreeNode
                    key={idx}
                    val={item}
                    nodeKey={idx}
                    currentPath={`root[${idx}]`}
                    isLast={idx === data.length - 1}
                  />
                ))}
              </div>
              ]
            </div>
          ) : (
            <div className="text-neutral-400 dark:text-slate-500 font-mono text-sm">{"{"}
              <div className="border-l border-neutral-250 dark:border-slate-850 pl-2 ml-2 mt-1">
                {Object.keys(data).map((key, idx, arr) => {
                  const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? `.${key}` : `["${key}"]`;
                  return (
                    <TreeNode
                      key={key}
                      val={data[key]}
                      nodeKey={key}
                      currentPath={`root${safeKey}`}
                      isLast={idx === arr.length - 1}
                    />
                  );
                })}
              </div>
              {"}"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
