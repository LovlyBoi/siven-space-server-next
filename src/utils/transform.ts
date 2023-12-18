export function toNumber(str: number): number;
export function toNumber(str: string): number | null;
export function toNumber(str: string | number): number | null;
export function toNumber(str: number | string): number | null {
  if (typeof str === 'number') {
    return str;
  } else if (typeof str === 'string') {
    const num = Number.parseFloat(str);
    return Number.isNaN(num) ? null : num;
  } else return null;
}
