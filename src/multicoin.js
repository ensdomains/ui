import base58check from 'base58check'
import bech32 from 'bech32'

export function encodeToHex(input, encoding) {
  switch (encoding) {
    case 'hex-checksum':
      return input
    case 'base58check':
      const { prefix, data } = base58check.decode(input, 'hex')
      console.log(prefix, data)
      return '0x' + prefix + data
    // case 'bech32':
    //   const { prefix: bech32Prefix, words } = bech32.decode(input)
    //   return (
    //     '0x' +
    //     bech32Prefix +
    //     parseInt(words.reduce((a, c) => `${a}${c}`)).toString(16)
    //   )
    default:
      throw `Unsupported base ${base}`
  }
}

export function decodeFromHex(hex, encoding) {
  switch (encoding) {
    case 'hex-checksum':
      return hex
    case 'base58check':
      const prefixRemoved = hex.slice(4)
      return base58check.encode(prefixRemoved)
    default:
      throw `Unsupported encoding: ${encoding}`
  }
}
