export function decodeStats(iv: number) {
  return [
    (iv >> 25) & 31,
    (iv >> 20) & 31,
    (iv >> 15) & 31,
    (iv >> 10) & 31,
    (iv >> 5) & 31,
    (iv >> 0) & 31
  ]
}