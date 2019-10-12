import { encodeToHex, decodeFromHex } from './multicoin'

describe('encodeToHex', () => {
  it('encodes bitcoin hash to correct hex', () => {
    const hash = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
    const hex = '0x0062e907b15cbf27d5425399ebf6f0fb50ebb88f18'
    expect(encodeToHex(hash, 'base58check')).toEqual(hex)
  })

  it('encodes litecoin has to correct hex', () => {
    const hash = 'LeJ4KvE7QhURHecZfNH7Kj6CDRwgM6rEGN'
    const hex = ''
    expect(encodeToHex(hash, 'base58check')).toEqual(hex)
  })

  // it('encodes bnb bech32 hash to correct hex', () => {
  //   const hash = 'bnb13ls59kuvaaxq7a05rpps6z5r72nqcla3tuc4nc'
  //   const hex = '0x8fe142db8cef4c0f75f418430d0a83f2a60c7fb1'
  //   expect(encodeToHex(hash, 'bech32')).toEqual(hex)
  // })
})

describe('decodeFromHex', () => {
  it('decodes bitcoin hex to correct base58 string', () => {
    const hash = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
    const hex = '0x0062e907b15cbf27d5425399ebf6f0fb50ebb88f18'
    expect(decodeFromHex(hex, 'base58check')).toEqual(hash)
  })

  it('decodes litecoin hex to correct base58 string', () => {
    const hash = 'LeJ4KvE7QhURHecZfNH7Kj6CDRwgM6rEGN'
    const hex = '0x30d1311d991d05dc801d63acc3c142321012efabed'
    expect(decodeFromHex(hex, 'base58check')).toEqual(hash)
  })
})
