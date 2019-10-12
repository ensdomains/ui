import base58check from 'base58check'

export function encodeToHex(input, base) {
  switch (base) {
    case 16:
      return input
    case 58:
      const { prefix, data } = base58check.decode(input, 'hex')
      return prefix + data
    default:
      throw `Unsupported base ${base}`
  }
}

export function decodeFromHex(hex, base) {
  switch (base) {
    case 16:
      return hex
    case 58:
      const prefixRemoved = hex.slice(2)
      return base58check.encode(prefixRemoved)
    default:
      throw `Unsupported base ${base}`
  }
}
