import type { Lattice } from '../models/Lattice';
import type { RuntimeLabel } from '../models/Label';
import type { FlowGraph } from '../models/FlowGraph';

interface Source {
  id: string;
  title: string;
  value: string;
  rtLabel: RuntimeLabel;
  ifcLabel: any;
  lio: any;
}

interface Sink {
  id: string;
  name: string;
  label: RuntimeLabel;
}

interface GeneratorInput {
  lattice: Lattice;
  sources: Source[];
  sinks: Sink[];
  graph: FlowGraph;
}

const RESERVED_IDENTIFIERS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'let',
  'static',
  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
  'await',
  'abstract',
  'boolean',
  'byte',
  'char',
  'double',
  'final',
  'float',
  'goto',
  'int',
  'long',
  'native',
  'short',
  'synchronized',
  'throws',
  'transient',
  'volatile',
]);

/**
 * Sanitizes a label name to be a valid TypeScript identifier
 */
function sanitizeLabelName(name: string): string {
  let sanitized = name.replace(/[^a-zA-Z0-9]/g, '_');
  if (!/^[A-Za-z_]/.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }
  if (RESERVED_IDENTIFIERS.has(sanitized)) {
    sanitized = `_${sanitized}`;
  }
  return sanitized;
}

/**
 * Generates TypeScript lattice definitions matching ifc-ts style
 * In ifc-ts, the lattice is a powerset lattice on principals (strings)
 */
function generateLatticeTypes(lattice: Lattice): string {
  const labels = Object.values(lattice.labels);
  const edges = lattice.edges;

  if (labels.length === 0) {
    return '// No labels defined in lattice\n';
  }

  const idToLabel = new Map(labels.map((label) => [label.id, label]));
  const sanitizedNames = new Map<string, string>();
  const usedNames = new Set<string>();
  labels.forEach((label) => {
    const prettyName = label.name ?? label.id;
    const base = sanitizeLabelName(prettyName);
    let candidate = base;
    let counter = 1;
    while (usedNames.has(candidate)) {
      candidate = `${base}_${counter++}`;
    }
    sanitizedNames.set(label.id, candidate);
    usedNames.add(candidate);
  });

  // Build adjacency for topological order
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  labels.forEach((label) => {
    outgoing.set(label.id, []);
    incoming.set(label.id, []);
  });
  edges.forEach((edge) => {
    outgoing.get(edge.from)?.push(edge.to);
    incoming.get(edge.to)?.push(edge.from);
  });

  const indegree = new Map<string, number>();
  labels.forEach((label) => indegree.set(label.id, incoming.get(label.id)?.length ?? 0));

  const queue = Array.from(indegree.entries())
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id)
    .sort((a, b) => a.localeCompare(b));

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    topoOrder.push(current);
    outgoing.get(current)?.forEach((next) => {
      const nextDegree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextDegree);
      if (nextDegree === 0) {
        queue.push(next);
        queue.sort((a, b) => a.localeCompare(b));
      }
    });
  }

  if (topoOrder.length !== labels.length) {
    topoOrder.splice(
      0,
      topoOrder.length,
      ...labels.map((l) => l.id).sort((a, b) => a.localeCompare(b))
    );
  }

  const topoIndex = new Map<string, number>();
  topoOrder.forEach((id, idx) => topoIndex.set(id, idx));

  const downSets = new Map<string, string[]>();
  topoOrder.forEach((id) => {
    const members = new Set<string>([id]);
    const parents = incoming.get(id) ?? [];
    parents.forEach((parentId) => {
      const parentSet = downSets.get(parentId);
      if (parentSet) {
        parentSet.forEach((member) => members.add(member));
      }
    });
    const orderedMembers = Array.from(members).sort((a, b) => {
      const idxA = topoIndex.get(a) ?? 0;
      const idxB = topoIndex.get(b) ?? 0;
      return idxA - idxB;
    });
    downSets.set(id, orderedMembers);
  });

  let code = '// LATTICE CONSTRUCTION___________________________________\n\n';

  topoOrder.forEach((id) => {
    const varName = sanitizedNames.get(id)!;
    const parentCandidates = incoming.get(id) ?? [];
    let baseParent: string | undefined;
    let baseParentSize = -1;
    parentCandidates.forEach((parentId) => {
      const parentSize = downSets.get(parentId)?.length ?? 0;
      if (parentSize > baseParentSize) {
        baseParent = parentId;
        baseParentSize = parentSize;
      }
    });

    let expression: string;
    const covered = new Set<string>();

    if (baseParent) {
      expression = sanitizedNames.get(baseParent)!;
      (downSets.get(baseParent) ?? []).forEach((member) => covered.add(member));
    } else {
      expression = `"${id}" as const`;
      covered.add(id);
    }

    const members = downSets.get(id) ?? [id];
    members.forEach((member) => {
      if (covered.has(member)) {
        return;
      }
      const term = member === id ? `"${member}"` : sanitizedNames.get(member)!;
      expression = `lub(${expression}, ${term})`;
      covered.add(member);
    });

    if (!covered.has(id)) {
      expression = `lub(${expression}, "${id}")`;
    }

    code += `const ${varName} = ${expression}\n`;
  });

  code += '\n';
  code += 'const bottom = botLevel // never\n';
  code += 'const top = topLevel   // string\n\n';

  code += '// Type-level subtyping checks --------------------------------\n\n';

  edges.forEach((edge, index) => {
    const fromLabel = idToLabel.get(edge.from);
    const toLabel = idToLabel.get(edge.to);
    if (fromLabel && toLabel) {
      const fromVar = sanitizedNames.get(fromLabel.id)!;
      const toVar = sanitizedNames.get(toLabel.id)!;
      code += `const ok${index + 1}: LEQ<typeof ${fromVar}, typeof ${toVar}> = true // ✅ ${fromLabel.id} ⊑ ${toLabel.id}\n`;
    }
  });

  const violationPair = (() => {
    for (let i = 0; i < topoOrder.length; i++) {
      for (let j = 0; j < topoOrder.length; j++) {
        if (i === j) continue;
        const fromId = topoOrder[i];
        const toId = topoOrder[j];
        const targetDownset = downSets.get(toId) ?? [];
        if (!targetDownset.includes(fromId)) {
          return { fromId, toId };
        }
      }
    }
    return null;
  })();

  if (violationPair) {
    const fromVar = sanitizedNames.get(violationPair.fromId)!;
    const toVar = sanitizedNames.get(violationPair.toId)!;
    code += '// @ts-expect-error — forbidden flow detected at compile time\n';
    code += `const notOk: LEQ<typeof ${fromVar}, typeof ${toVar}> = true\n`;
  }
  return code + '\n';
}

/**
 * Generates source declarations using ifc-ts `src` and `label`
 */
function generateSources(sources: Source[]): string {
  if (sources.length === 0) {
    return '// No sources created\n';
  }

  let code = '// Source Definitions\n';
  code += '// Each source is created using the src() function from ifc-ts\n\n';

  sources.forEach((source, index) => {
    const varName = `source${index + 1}`;
    const labelId = source.rtLabel.id;
    const value = JSON.stringify(source.value);

    code += `const ${varName}: Src<"${labelId}", string> = src(\n`;
    code += `  "${labelId}",\n`;
    code += `  () => ${value}\n`;
    code += `)\n\n`;
  });

  return code;
}

/**
 * Generates the flow computations (transformations and combinations)
 * Returns both the code and the nodeVarNames mapping
 */
function generateFlowComputations(
  graph: FlowGraph,
  sources: Source[]
): { code: string; nodeVarNames: Map<string, string> } {
  let code = '// Flow Computations\n';
  code += '// LIO monad operations: input, bind, ret, label\n\n';

  const processedNodes = new Set<string>();
  const nodeVarNames = new Map<string, string>();
  let computationCounter = 1;

  // First, process all sources to create initial computations
  sources.forEach((source, index) => {
    const sourceNode = graph.nodes.find((n) => n.id === source.id);
    if (sourceNode) {
      const varName = `computation${computationCounter++}`;
      const labelId = source.rtLabel.id;
      nodeVarNames.set(source.id, varName);
      code += `// Reading from ${source.rtLabel.name} source\n`;
      code += `const ${varName}: LIO<Top, Bot, Labeled<"${labelId}", string>> = input(source${index + 1})\n\n`;
      processedNodes.add(source.id);
    }
  });

  // Process map and combine nodes
  const mapAndCombineNodes = graph.nodes.filter((n) => n.kind === 'map' || n.kind === 'combine');

  mapAndCombineNodes.forEach((node) => {
    const varName = `computation${computationCounter++}`;
    nodeVarNames.set(node.id, varName);

    // Find parent edges
    const parentEdges = graph.edges.filter((e) => e.to === node.id);
    const parentIds = parentEdges.map((e) => e.from);

    if (node.kind === 'map') {
      const parentVar = nodeVarNames.get(parentIds[0]);
      if (parentVar) {
        code += `// Map transformation: ${node.data.title}\n`;
        code += `const ${varName} = bind(\n`;
        code += `  ${parentVar},\n`;
        code += `  (labeled) => {\n`;
        code += `    const [l, v] = labeled\n`;
        code += `    const transformed = v + " (transformed)"\n`;
        code += `    return ret(label(l, transformed))\n`;
        code += `  }\n`;
        code += `)\n\n`;
      }
    } else if (node.kind === 'combine') {
      const parent1Var = nodeVarNames.get(parentIds[0]);
      const parent2Var = nodeVarNames.get(parentIds[1]);
      if (parent1Var && parent2Var) {
        code += `// Combine operation: ${node.data.title}\n`;
        code += `const ${varName} = bind(\n`;
        code += `  ${parent1Var},\n`;
        code += `  (labeled1) => bind(\n`;
        code += `    ${parent2Var},\n`;
        code += `    (labeled2) => {\n`;
        code += `      const [l1, v1] = labeled1\n`;
        code += `      const [l2, v2] = labeled2\n`;
        code += `      // Join the labels (at compile-time, this is LUB<L1, L2>)\n`;
        code += `      const joined = lub(l1, l2)\n`;
        code += `      const combined = v1 + " + " + v2\n`;
        code += `      return ret(label(joined, combined))\n`;
        code += `    }\n`;
        code += `  )\n`;
        code += `)\n\n`;
      }
    }

    processedNodes.add(node.id);
  });

  if (computationCounter === 1) {
    code += '// No flow computations created\n';
  }

  return { code, nodeVarNames };
}

/**
 * Generates sink definitions and output operations
 */
function generateSinks(sinks: Sink[], graph: FlowGraph, nodeVarNames: Map<string, string>): string {
  if (sinks.length === 0) {
    return '// No sinks created\n';
  }

  let code = '// Sink Definitions\n';
  code += '// Sinks define where data can be written (with label checks)\n\n';

  sinks.forEach((sink, index) => {
    const sinkVar = `sink${index + 1}`;
    const labelId = sink.label.id;

    code += `const ${sinkVar}: Snk<"${labelId}", string> = snk(\n`;
    code += `  "${labelId}",\n`;
    code += `  (data) => console.log("[${sink.name}]:", data)\n`;
    code += `)\n\n`;
  });

  // Find write operations (edges to sink nodes)
  code += '// Output Operations\n';
  code += '// These operations attempt to write data to sinks\n';
  code += '// Type checking ensures label(data) ⊑ label(sink)\n\n';

  const writeEdges = graph.edges.filter((e) => {
    const targetNode = graph.nodes.find((n) => n.id === e.to);
    return targetNode?.kind === 'sink';
  });

  if (writeEdges.length === 0) {
    code += '// No write operations performed\n';
  } else {
    writeEdges.forEach((edge, index) => {
      const sourceNode = graph.nodes.find((n) => n.id === edge.from);
      const sinkNode = graph.nodes.find((n) => n.id === edge.to);

      if (sourceNode && sinkNode) {
        const sinkIndex = sinks.findIndex((s) => `sink-${s.id}` === sinkNode.id);
        const sourceVarName = nodeVarNames.get(sourceNode.id);
        const violation = edge.violation || false;

        if (!sourceVarName) {
          // Skip if we can't find the computation variable
          return;
        }

        if (violation) {
          code += `// ❌ This write would FAIL at compile-time (label mismatch)\n`;
          code += `// The data label does not satisfy: DataLabel ⊑ SinkLabel\n`;
          code += `// TypeScript will reject this at compile-time!\n`;
          code += `// @ts-expect-error - Type error: Labeled<DataLabel, V> is not assignable to Labeled<SinkLabel, V>\n`;
        } else {
          code += `// ✅ This write is allowed (label flows correctly)\n`;
          code += `// The data label satisfies: DataLabel ⊑ SinkLabel\n`;
        }

        code += `const write${index + 1} = bind(\n`;
        code += `  ${sourceVarName},\n`;
        code += `  output(sink${sinkIndex + 1})\n`;
        code += `)\n\n`;
      }
    });
  }

  return code;
}

/**
 * Main function to generate complete IFC-safe TypeScript code
 */
export function generateIfcSafeCode(input: GeneratorInput): string {
  const timestamp = new Date().toISOString();

  let code = `/**
 * IFC-Safe Code Generated from ifc-ts Interactive Demo
 * Generated on: ${timestamp}
 *
 * This code demonstrates how the visual flows you created
 * would be implemented using the ifc-ts library with
 * compile-time information flow control.
 */

import {
  src,
  snk,
  input,
  output,
  label,
  bind,
  ret,
  lub,
  botLevel,
  topLevel
} from 'ifc-ts'
import type { LEQ, Src, Snk, LIO, Labeled, Top, Bot } from 'ifc-ts'

`;

  code += generateLatticeTypes(input.lattice) + '\n';
  code += generateSources(input.sources) + '\n';

  const { code: flowCode, nodeVarNames } = generateFlowComputations(input.graph, input.sources);
  code += flowCode + '\n';

  code += generateSinks(input.sinks, input.graph, nodeVarNames) + '\n';

  return code;
}
