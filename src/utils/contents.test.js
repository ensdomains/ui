import {
  encodeContenthash,
  decodeContenthash,
  isValidContenthash
} from './contents'

describe('test contenthash utility functions', () => {
  test('encodeContentHash returns encoded hash', () => {
    const encodedContentHash = encodeContenthash(
      'bzz://d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162'
    )

    expect(encodedContentHash).toBe(
      '0xe40101fa011b20d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162'
    )
  })

  test('decodeContentHash returns decoded contenthash', () => {
    const decoded = decodeContenthash(
      '0xe40101fa011b20d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162'
    )

    expect(decoded.decoded).toBe(
      'd1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162'
    )
    expect(decoded.protocolType).toBe('bzz')
    expect(decoded.error).toBe(undefined)
  })

  test('isValidContent returns true for real contenthash', () => {
    const valid = isValidContenthash(
      '0xe40101fa011b20d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162'
    )

    expect(valid).toBe(true)
  })

  test('isValidContent returns false for non hex', () => {
    const valid = isValidContenthash(
      '0xe40101fa011b20d1de9994b4d039f6548d191eb26786769f580809256b4685ef31680z'
    )

    expect(valid).toBe(false)
  })

  test('isValidContent returns false for unknown codec', () => {
    const valid = isValidContenthash(
      '0xe20101fa011b20d1de9994b4d039f6548d191eb26786769f580809256b4685ef31680z'
    )

    expect(valid).toBe(false)
  })

  test('encodeContentHash returns encoded hash', () => {
    const encodedContentHash = encodeContenthash(
      'onion://3g2upl4pq6kufc4m'
    )

    expect(encodedContentHash).toBe(
      '0xbc0333673275706c347071366b756663346d'
    )
  })

  test('decodeContentHash returns decoded contenthash', () => {
    const decoded = decodeContenthash(
      '0xbc0333673275706c347071366b756663346d'
    )

    expect(decoded.decoded).toBe(
      '3g2upl4pq6kufc4m'
    )
    expect(decoded.protocolType).toBe('onion')
    expect(decoded.error).toBe(undefined)
  })

  test('isValidContent returns true for real contenthash', () => {
    const valid = isValidContenthash(
      '0xbc0333673275706c347071366b756663346d'
    )

    expect(valid).toBe(true)
  })

  test('encodeContentHash returns encoded hash', () => {
    const encodedContentHash = encodeContenthash(
      'onion://vww6ybal4bd7szmgncyruucpgfkqahzddi37ktceo3ah7ngmcopnpyyd'
    )

    expect(encodedContentHash).toBe(
      '0xbc03767777367962616c34626437737a6d676e6379727575637067666b7161687a64646933376b7463656f336168376e676d636f706e70797964'
    )
  })

  test('decodeContentHash returns decoded contenthash', () => {
    const decoded = decodeContenthash(
      '0xbc03767777367962616c34626437737a6d676e6379727575637067666b7161687a64646933376b7463656f336168376e676d636f706e70797964'
    )

    expect(decoded.decoded).toBe(
      'vww6ybal4bd7szmgncyruucpgfkqahzddi37ktceo3ah7ngmcopnpyyd'
    )
    expect(decoded.protocolType).toBe('onion')
    expect(decoded.error).toBe(undefined)
  })

  test('isValidContent returns true for real contenthash', () => {
    const valid = isValidContenthash(
      '0xbc03767777367962616c34626437737a6d676e6379727575637067666b7161687a64646933376b7463656f336168376e676d636f706e70797964'
    )

    expect(valid).toBe(true)
  })
})
