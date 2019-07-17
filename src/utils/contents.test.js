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
      'onion://p53lf57qovyuvwsc6xnrppyply3vtqm7l6pcobkmyqsiofyeznfu5uqd'
    )

    expect(encodedContentHash).toBe(
      '0xbd037035336c663537716f7679757677736336786e72707079706c79337674716d376c3670636f626b6d797173696f6679657a6e667535757164'
    )
  })

  test('decodeContentHash returns decoded contenthash', () => {
    const decoded = decodeContenthash(
      '0xbd037035336c663537716f7679757677736336786e72707079706c79337674716d376c3670636f626b6d797173696f6679657a6e667535757164'
    )

    expect(decoded.decoded).toBe(
      'p53lf57qovyuvwsc6xnrppyply3vtqm7l6pcobkmyqsiofyeznfu5uqd'
    )
    expect(decoded.protocolType).toBe('onion3')
    expect(decoded.error).toBe(undefined)
  })

  test('isValidContent returns true for real contenthash', () => {
    const valid = isValidContenthash(
      '0xbd037035336c663537716f7679757677736336786e72707079706c79337674716d376c3670636f626b6d797173696f6679657a6e667535757164'
    )

    expect(valid).toBe(true)
  })
})
