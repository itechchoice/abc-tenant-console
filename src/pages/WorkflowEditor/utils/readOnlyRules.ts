function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in cur) || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

function findAllPathsByKey(obj: unknown, key: string, basePath = ''): string[] {
  const results: string[] = [];
  if (!obj || typeof obj !== 'object') return results;
  const record = obj as Record<string, unknown>;
  if (key in record) {
    results.push(basePath ? `${basePath}.${key}` : key);
  }
  for (const k of Object.keys(record)) {
    const v = record[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      results.push(...findAllPathsByKey(v, key, basePath ? `${basePath}.${k}` : k));
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === 'object') {
          results.push(
            ...findAllPathsByKey(item, key, `${basePath ? `${basePath}.` : ''}${k}.${i}`),
          );
        }
      });
    }
  }
  return results;
}

interface DslGraph {
  nodes?: Array<{ id?: string; config?: { loopBody?: { nodes?: Array<{ id?: string }> } } }>;
}

/**
 * Restore readonly fields in the edited DSL back to their original values.
 * Returns the list of restored paths.
 */
export function restoreReadOnlyFields(
  parsed: DslGraph,
  initialDsl: DslGraph,
  readOnlyKeys: string[] = [],
): string[] {
  const restored = new Set<string>();
  if (!initialDsl?.nodes || !readOnlyKeys.length) return [...restored];

  const flatKeys = new Set(readOnlyKeys.filter((k) => !k.includes('.')));
  const pathKeys = readOnlyKeys.filter((k) => k.includes('.'));

  const initialById = new Map<string, Record<string, unknown>>();
  (initialDsl.nodes || []).forEach((n) => {
    if (n?.id) initialById.set(n.id, n as unknown as Record<string, unknown>);
  });

  function restoreNode(target: Record<string, unknown>, source: Record<string, unknown>) {
    for (const path of pathKeys) {
      const srcVal = getByPath(source, path);
      if (srcVal === undefined) continue;
      const tgtVal = getByPath(target, path);
      if (tgtVal !== srcVal) {
        setByPath(target, path, srcVal);
        restored.add(path);
      }
    }

    for (const key of flatKeys) {
      const paths = findAllPathsByKey(source, key);
      for (const p of paths) {
        const srcVal = getByPath(source, p);
        const tgtVal = getByPath(target, p);
        if (srcVal !== undefined && tgtVal !== srcVal) {
          setByPath(target, p, srcVal);
          restored.add(p);
        }
      }
    }

    const srcLoopNodes = (source as Record<string, unknown>).config as Record<string, unknown> | undefined;
    const tgtLoopNodes = (target as Record<string, unknown>).config as Record<string, unknown> | undefined;
    const srcBody = srcLoopNodes?.loopBody as { nodes?: Array<Record<string, unknown>> } | undefined;
    const tgtBody = tgtLoopNodes?.loopBody as { nodes?: Array<Record<string, unknown>> } | undefined;
    if (srcBody?.nodes && tgtBody?.nodes) {
      tgtBody.nodes.forEach((tn) => {
        const sn = tn?.id ? srcBody.nodes!.find((s) => s?.id === tn.id) : null;
        if (sn) restoreNode(tn, sn);
      });
    }
  }

  (parsed.nodes || []).forEach((tn) => {
    const sn = tn?.id ? initialById.get(tn.id) : null;
    if (sn) restoreNode(tn as unknown as Record<string, unknown>, sn);
  });
  return [...restored];
}
