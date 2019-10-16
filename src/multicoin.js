import bs58 from 'bs58'

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
      return '0x' + bytes.toString('hex')
    case 'base58check':
      return bs58.encode(bytes)
    default:
      throw `Unsupported encoding: ${encoding}`
  }
}
