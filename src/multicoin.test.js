import { encodeToBytes, decodeFromBytes } from './multicoin'

describe('encodeToBytes', () => {
  it('encodes bitcoin hash to correct hex', () => {
    const hash = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
    const result = encodeToBytes(hash, 'base58check')
    expect(result).toMatchSnapshot()
  })

  it('encodes litecoin has to correct hex', () => {
    const hash = 'LeJ4KvE7QhURHecZfNH7Kj6CDRwgM6rEGN'
    expect(encodeToBytes(hash, 'base58check')).toMatchSnapshot()
  })
})

describe('decodeFromBytes', () => {
  it('decodes bitcoin hex to correct base58 string', () => {
    const hash = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
    expect(
      decodeFromBytes(
        Buffer.from([
          0,
          98,
          233,
          7,
          177,
          92,
          191,
          39,
          213,
          66,
          83,
          153,
          235,
          246,
          240,
          251,
          80,
          235,
          184,
          143,
          24,
          194,
          155,
          125,
          147
        ]),
        'base58check'
      )
    ).toEqual('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
  })

  it('decodes litecoin hex to correct base58 string', () => {
    const address = 'LeJ4KvE7QhURHecZfNH7Kj6CDRwgM6rEGN'
    const hex = '0x30d1311d991d05dc801d63acc3c142321012efabed'
    expect(
      decodeFromBytes(
        Buffer.from([
          48,
          209,
          49,
          29,
          153,
          29,
          5,
          220,
          128,
          29,
          99,
          172,
          195,
          193,
          66,
          50,
          16,
          18,
          239,
          171,
          237,
          55,
          130,
          240,
          135
        ]),
        'base58check'
      )
    ).toEqual(address)
  })
})

describe('encodes and decodes back and forth', () => {
  it('encodes/decodes bitcoin hash', () => {
    const hash = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
    const result = encodeToBytes(hash, 'base58check')
    expect(decodeFromBytes(result, 'base58check')).toEqual(hash)
  })
  it('encodes/decodes litecoin hash', () => {
    const hash = 'LeJ4KvE7QhURHecZfNH7Kj6CDRwgM6rEGN'
    const result = encodeToBytes(hash, 'base58check')
    expect(decodeFromBytes(result, 'base58check')).toEqual(hash)
  })
})
