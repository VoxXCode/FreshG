/** Helper format tampilan (dipakai di UI). */

export function formatRupiah(amount: number): string {
  const digits = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${digits}`;
}

export function daysSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}
