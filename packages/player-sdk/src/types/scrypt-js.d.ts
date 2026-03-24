declare module 'scrypt-js' {
  export function scrypt(
    password: Uint8Array,
    salt: Uint8Array,
    N: number,
    r: number,
    p: number,
    keyLength: number,
    progress?: (progress: number) => void
  ): Promise<Uint8Array>;
}