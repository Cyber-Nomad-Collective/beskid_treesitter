/**
 * Minimal parser for beskid.pest-style rule definitions.
 * Not a full Pest implementation — enough to drive tree-sitter codegen.
 */

/** @typedef {'seq' | 'choice' | 'repeat' | 'repeat1' | 'optional' | 'neg' | 'string' | 'ref' | 'special'} PestNode */

/**
 * @param {string} pestPath
 * @returns {{ rules: Map<string, { name: string, silent: boolean, atomic: boolean, body: string, bodyAst: PestNode }>, keywords: string[], primitives: string[] }}
 */
export function parsePestFile(pestPath, content) {
  const rules = new Map();
  const keywords = [];
  const primitives = [];

  const lines = content.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    i++;
    if (!line || line.startsWith('//')) continue;

    const match = line.match(/^([A-Z][A-Za-z0-9_]*)\s*=\s*(@|_)?\{\s*(.*)$/);
    if (!match) continue;

    const [, name, mod, start] = match;
    let body = start;
    let silent = mod === '_';
    const atomic = mod === '@';

    while (!body.includes('}') && i < lines.length) {
      body += ' ' + lines[i].trim();
      i++;
    }
    body = body.replace(/\}\s*$/, '').trim();

    if (name.endsWith('Keyword') && body.startsWith('"')) {
      const kw = body.match(/^"([^"]+)"/)?.[1];
      if (kw) keywords.push(kw);
    }
    if (name === 'PrimitiveType') {
      for (const m of body.matchAll(/"([^"]+)"/g)) primitives.push(m[1]);
    }

    const bodyAst = parsePestExpr(body);
    rules.set(name, { name, silent, atomic, body, bodyAst });
  }

  return { rules, keywords: [...new Set(keywords)], primitives: [...new Set(primitives)] };
}

/**
 * @param {string} expr
 * @returns {PestNode}
 */
export function parsePestExpr(expr) {
  expr = expr.trim();
  if (!expr) return { type: 'seq', items: [] };

  // Top-level choice (lowest precedence in pest composition)
  const choiceParts = splitAtTopLevel(expr, '|');
  if (choiceParts.length > 1) {
    return { type: 'choice', items: choiceParts.map(parsePestExpr) };
  }

  // Sequence with ~
  const seqParts = splitAtTopLevel(expr, '~');
  if (seqParts.length > 1) {
    const items = [];
    for (const part of seqParts) {
      const trimmed = part.trim();
      items.push(parsePestSuffix(trimmed));
    }
    return { type: 'seq', items };
  }

  return parsePestSuffix(expr);
}

/**
 * @param {string} expr
 * @returns {PestNode}
 */
function parsePestSuffix(expr) {
  expr = expr.trim();

  if (expr.startsWith('!(') || expr.startsWith('!{')) {
    return { type: 'neg', inner: { type: 'special', value: expr } };
  }
  if (expr.startsWith('!')) {
    return { type: 'neg', inner: parsePestSuffix(expr.slice(1).trim()) };
  }

  let base;
  let rest = expr;

  if (rest.endsWith('*')) {
    base = parsePestSuffix(rest.slice(0, -1).trim());
    return { type: 'repeat', inner: base };
  }
  if (rest.endsWith('+')) {
    base = parsePestSuffix(rest.slice(0, -1).trim());
    return { type: 'repeat1', inner: base };
  }
  if (rest.endsWith('?')) {
    base = parsePestSuffix(rest.slice(0, -1).trim());
    return { type: 'optional', inner: base };
  }

  if (rest.startsWith('(') && rest.endsWith(')')) {
    return parsePestExpr(rest.slice(1, -1).trim());
  }

  if (rest.startsWith('"')) {
    const end = rest.indexOf('"', 1);
    const value = rest.slice(1, end);
    return { type: 'string', value };
  }

  if (/^[A-Z][A-Za-z0-9_]*$/.test(rest)) {
    return { type: 'ref', name: rest };
  }

  if (/^SOI|EOI|ANY|ASCII_|NEWLINE$/.test(rest) || rest.includes('ASCII_')) {
    return { type: 'special', value: rest };
  }

  // Fallback: opaque
  return { type: 'special', value: rest };
}

/**
 * @param {string} expr
 * @param {string} sep
 * @returns {string[]}
 */
function splitAtTopLevel(expr, sep) {
  /** @type {string[]} */
  const parts = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '(' || ch === '{') depth++;
    if (ch === ')' || ch === '}') depth--;
    if (depth === 0 && expr.startsWith(sep, i)) {
      parts.push(current.trim());
      current = '';
      i += sep.length - 1;
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.length ? parts : [expr];
}
