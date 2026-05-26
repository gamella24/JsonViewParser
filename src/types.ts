/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface JsonParseError {
  message: string;
  line?: number;
  column?: number;
  position?: number;
}

export interface JsonMetadata {
  sizeInBytes: number;
  lineCount: number;
  characterCount: number;
  depth: number;
  nodeCount: number;
  arrayCount: number;
  objectCount: number;
  primitiveCount: number;
}

export interface JsonTreeSearchContext {
  query: string;
  matchCase: boolean;
  highlightedIds: string[];
  activeIdIndex: number;
}
