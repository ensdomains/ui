import {
  encodeContenthash,
  decodeContenthash,
  isValidContenthash
} from '../contents'

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
})
