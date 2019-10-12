import { encodeToHex, decodeFromHex } from './multicoin'

describe('encodeToHex', () => {
  it('encodes bitcoin hash to correct hex', () => {
    const hash = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
    const hex = ' 0062e907b15cbf27d5425399ebf6f0fb50ebb88f18'
    expect(encodeToHex(hash, 58)).toEqual(
      '0062e907b15cbf27d5425399ebf6f0fb50ebb88f18'
    )
  })
})

describe('decodeFromHex', () => {
  it('decodes bitcoin hex to correct base58 string', () => {
    const hash = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
    const hex = '0062e907b15cbf27d5425399ebf6f0fb50ebb88f18'
    expect(decodeFromHex(hex, 58)).toEqual(hash)
  })
})
