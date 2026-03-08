export function formatDuration(durationMs) {
  if (!durationMs) return '0s';
  if (durationMs < 1000) return `${durationMs}ms`;
  const seconds = Math.round(durationMs / 100) / 10;
  return `${seconds}s`;
}

export function formatClock(timestamp) {
  if (!timestamp) return '--:--';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPayload(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
