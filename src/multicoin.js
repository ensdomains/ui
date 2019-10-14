import bs58 from 'bs58'
import bech32 from 'bech32'

export function encodeToBytes(input, encoding) {
  switch (encoding) {
    case 'hex-checksum':
      return input
    case 'base58check':
      const bytes = bs58.decode(input)
      return bytes
    default:
      throw `Unsupported base ${base}`
  }
}

export function decodeFromBytes(bytes, encoding) {
  switch (encoding) {
    case 'hex-checksum':
      return hex
    case 'base58check':
      return bs58.encode(bytes)
    default:
      throw `Unsupported encoding: ${encoding}`
  }
}
