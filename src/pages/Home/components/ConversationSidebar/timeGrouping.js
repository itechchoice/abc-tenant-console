const DAY_MS = 86_400_000;

export function groupByTime(sessions) {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - DAY_MS;
  const weekStart = todayStart - 7 * DAY_MS;
  const monthStart = todayStart - 30 * DAY_MS;

  const buckets = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    Older: [],
  };

  sessions.forEach((session) => {
    const raw = session.lastMessageAt || session.updatedAt || session.createdAt;
    const timestamp = typeof raw === 'string' ? new Date(raw).getTime() : (raw || 0);

    if (timestamp >= todayStart) buckets.Today.push(session);
    else if (timestamp >= yesterdayStart) buckets.Yesterday.push(session);
    else if (timestamp >= weekStart) buckets['Previous 7 Days'].push(session);
    else if (timestamp >= monthStart) buckets['Previous 30 Days'].push(session);
    else buckets.Older.push(session);
  });

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}
