export function formatBRL(value: number): string {
  const fixed = Math.abs(value).toFixed(2);
  const [ints, cents] = fixed.split('.');
  const withThousands = ints.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '-' : ''}R$ ${withThousands},${cents}`;
}

/** Aceita "12,50", "12.50", "R$ 12,50", "1.234,56" */
export function parseBRL(text: string): number | null {
  const cleaned = text.replace(/[R$\s]/gi, '');
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  if (min < 1) return '< 1 min';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export function formatClock(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
