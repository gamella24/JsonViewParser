/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsonParseError, JsonMetadata } from "../types";

/**
 * Parses JSON text and provides precise line and column numbers if parsing fails.
 */
export function parseJsonWithErrorDetails(text: string): {
  success: boolean;
  data: any;
  error?: JsonParseError;
} {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      success: false,
      data: null,
      error: { message: "Input is empty. Please enter or paste some JSON text." }
    };
  }

  try {
    const data = JSON.parse(text);
    return { success: true, data };
  } catch (err: any) {
    const errorMessage = err.message || "Unknown error parsing JSON";
    const result: JsonParseError = { message: errorMessage };

    // Attempt to extract position from browser-specific error messages
    // Chrome/V8: "Unexpected token } in JSON at position 123" or "Expected double-quoted property name in JSON at position 4"
    // Firefox: "JSON.parse: expected property name or '}' at line 2 column 5 of the JSON data"
    let position: number | undefined;
    let line: number | undefined;
    let column: number | undefined;

    const firefoxMatch = errorMessage.match(/line (\d+) column (\d+)/i);
    if (firefoxMatch) {
      line = parseInt(firefoxMatch[1], 10);
      column = parseInt(firefoxMatch[2], 10);
    } else {
      const positionMatch = errorMessage.match(/at position (\d+)/i) || 
                            errorMessage.match(/character (\d+)/i) ||
                            errorMessage.match(/char (\d+)/i);
      
      if (positionMatch) {
        position = parseInt(positionMatch[1], 10);
      } else {
        // Fallback: check if the error object has a position or index property (some engines do)
        const pos = err.position ?? err.index ?? err.columnNumber;
        if (typeof pos === "number") {
          position = pos;
        }
      }

      if (position !== undefined && position >= 0 && position <= text.length) {
        // Calculate line and column from character position
        const textUpToPos = text.slice(0, position);
        const lines = textUpToPos.split("\n");
        line = lines.length;
        column = lines[lines.length - 1].length + 1; // 1-based index
        result.position = position;
      }
    }

    result.line = line;
    result.column = column;
    
    // Enrich local errors if line/col is found
    if (line !== undefined && column !== undefined) {
      result.message = `${errorMessage} (at line ${line}, column ${column})`;
    }

    return {
      success: false,
      data: null,
      error: result
    };
  }
}

/**
 * Attempts to automatically repair common syntax errors in loose/invalid JSON strings.
 * This includes:
 * - Trailing commas in arrays or objects: [1, 2,] or {"a": 1, }
 * - Unbalanced/single quotes: 'key': 'value' -> "key": "value"
 * - Smart quote normalization: “smart quotes” -> "smart quotes"
 * - Missing quotes around property keys: {foo: "bar"} -> {"foo": "bar"}
 */
export function autoFixJson(text: string): string {
  let fixed = text;

  // 1. Standardize line endings and normalize smart quotes
  fixed = fixed.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
  fixed = fixed.replace(/[\u2018\u2019\u201A\u201B]/g, "'");

  // 2. Remove JavaScript-style comments: // compound or /* comments */
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, ""); // Multi-line comments
  fixed = fixed.replace(/\/\/.*/g, "");            // Single-line comments

  // 3. Convert single quoted string properties to double quotes
  // We need to be careful not to corrupt double-quoted strings.
  // A standard regex-based approach for common occurrences:
  // Keys with single quotes: 'key': -> "key":
  fixed = fixed.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '"$1":');
  // Values with single quotes: : 'value' -> : "value"
  fixed = fixed.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ': "$1"');
  // Array values with single quotes: ['a', 'b'] -> ["a", "b"]
  fixed = fixed.replace(/,\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ', "$1"');
  fixed = fixed.replace(/\[\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, '["$1"');

  // 4. Quote unquoted property keys: { foo: "bar" } or { foo_bar: 123 }
  // This looks for word characters preceding a colon, ensuring they aren't part of any string already.
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

  // 5. Remove trailing commas in arrays and objects before closing brackets
  fixed = fixed.replace(/,\s*([\]}])/g, "$1");

  // 6. Replace single standalone quotes around properties if there's syntax corruption
  // Treat missing wrapper quotes if simple numeric/boolean
  
  return fixed;
}

/**
 * Formats a valid JSON object into a string with specified indentation.
 */
export function formatJson(data: any, spaceCount: number | string = 2): string {
  const indent = typeof spaceCount === "number" ? spaceCount : spaceCount;
  return JSON.stringify(data, null, indent);
}

/**
 * Minifies a valid JSON object into a single line of raw text.
 */
export function minifyJson(data: any): string {
  return JSON.stringify(data);
}

/**
 * Computes statistical metadata regarding structural depth, node counts, types, etc.
 */
export function computeJsonMetadata(data: any, rawText: string): JsonMetadata {
  let depth = 0;
  let nodeCount = 0;
  let arrayCount = 0;
  let objectCount = 0;
  let primitiveCount = 0;

  function traverse(node: any, currentDepth: number) {
    nodeCount++;
    depth = Math.max(depth, currentDepth);

    if (node === null || typeof node !== "object") {
      primitiveCount++;
      return;
    }

    if (Array.isArray(node)) {
      arrayCount++;
      node.forEach((item) => traverse(item, currentDepth + 1));
    } else {
      objectCount++;
      Object.keys(node).forEach((key) => {
        traverse(node[key], currentDepth + 1);
      });
    }
  }

  traverse(data, 1);

  const lines = rawText.split("\n");

  return {
    sizeInBytes: new Blob([rawText]).size,
    lineCount: lines.length,
    characterCount: rawText.length,
    depth: data === null || typeof data !== "object" ? 1 : depth,
    nodeCount,
    arrayCount,
    objectCount,
    primitiveCount
  };
}

/**
 * Filters and escapes values for text queries
 */
export function getSampleJson(type: "simple" | "nested" | "large" | "api" | "errors"): string {
  switch (type) {
    case "simple":
      return JSON.stringify({
        id: 101,
        title: "Introduction to JSON Parsing",
        active: true,
        category: "Tutorial",
        tags: ["json", "parser", "utility"],
        rating: 4.85,
        owner: null
      }, null, 2);
    
    case "nested":
      return JSON.stringify({
        app: "Online JSON Studio",
        version: "2.1.0",
        settings: {
          theme: "dark",
          autosave: true,
          font: {
            family: "JetBrains Mono",
            size: 14,
            ligatures: true
          },
          panelSizes: [30, 70]
        },
        users: [
          {
            id: "usr_94",
            name: "Devon Carter",
            email: "devon@example.com",
            roles: ["Administrator", "Developer"],
            profile: {
              active: true,
              lastLogin: "2026-05-25T08:14:02Z",
              preferences: {
                notifications: { email: true, push: false }
              }
            }
          },
          {
            id: "usr_52",
            name: "Fiona Gallagher",
            email: "fiona@example.com",
            roles: ["Reviewer"],
            profile: {
              active: false,
              lastLogin: "2026-04-12T19:33:55Z",
              preferences: {
                notifications: { email: false, push: false }
              }
            }
          }
        ],
        metadata: {
          apiEndpoint: "https://api.jsonparser.online.fr/v1",
          supportedVersions: ["1.0", "2.0", "2.1"],
          rateLimit: 5000
        }
      }, null, 2);

    case "large":
      return JSON.stringify({
        status: "success",
        data: {
          items: Array.from({ length: 15 }).map((_, i) => ({
            index: i + 1,
            guid: `f47ac10b-58cc-4372-a567-0e02${100000 + i}`,
            balance: `$${(2500 + i * 142.5).toFixed(2)}`,
            picture: `https://picsum.photos/id/${10 + i}/100/100`,
            age: 22 + (i % 8),
            eyeColor: ["blue", "brown", "green", "hazel"][i % 4],
            name: {
              first: ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah"][i % 8],
              last: ["Smith", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Thomas"][i % 8]
            },
            company: `${["TechCorp", "InnovateLLC", "PixelFactory", "DataLabs"][i % 4]} Inc.`,
            coordinates: {
              latitude: (37.7749 + (i * 0.02)).toFixed(4),
              longitude: (-122.4194 - (i * 0.03)).toFixed(4)
            },
            favoriteFruit: ["apple", "banana", "strawberry"][i % 3]
          }))
        }
      }, null, 2);

    case "api":
      return JSON.stringify({
        routes: [
          {
            path: "/api/parse",
            method: "POST",
            description: "Submit raw JSON to be formatted and validated",
            parameters: {
              body: {
                text: { type: "string", required: true },
                beautify: { type: "boolean", default: true },
                indent: { type: "number", default: 2 }
              }
            },
            response: {
              status: "200 OK",
              payload: {
                valid: true,
                formatted: "{\n  \"status\": \"parsed\"\n}",
                characterCount: 22
              }
            }
          }
        ]
      }, null, 2);

    case "errors":
      return `{
  school: "Academy of Sciences",
  year: 2026,
  students: [
    { name: "Julian", age: 16 },
    { name: "Sophia", age: 15 }, // Notice missing quotes and trailing comma next
  ],
  isFunded: true,
}`;

    default:
      return "{}";
  }
}
