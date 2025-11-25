export type Ms = number & { readonly __brand: 'Ms' };
export const ms = (n: number): Ms => n as Ms;
