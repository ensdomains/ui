import {
  validateName,
  encodeLabelHash,
  decodeLabelHash,
  isEncodedLabelHash,
  isDecrypted,
  namehash,
  labelhash
} from '../utils'

test('validateName returns true for valid names', () => {
  expect(validateName('vitalik')).toBe('vitalik')
  expect(validateName('Vitalik')).toBe('vitalik')
  expect(validateName('Vitalik.eth')).toBe('vitalik.eth')
  expect(validateName('sub.Vitalik.eth')).toBe('sub.vitalik.eth')
})

test('validateName returns false for invalid names', () => {
  expect(() => validateName('$vitalik')).toThrowError('Illegal char $')
  expect(() => validateName('#vitalik')).toThrowError('Illegal char #')
  expect(() => validateName('vitalik ')).toThrowError('Illegal char ')
})

test('test encode labelhash', () => {
  expect(
    encodeLabelHash(
      '0xa5ae37e4e1678eb9b22dd4be5ae84226b09a448a4790c7fec33ba86b6d9b3e65'
    )
  ).toBe('[a5ae37e4e1678eb9b22dd4be5ae84226b09a448a4790c7fec33ba86b6d9b3e65]')

  expect(() =>
    encodeLabelHash(
      '0xa5ae37e4e1678eb9b22dd4be5ae84226b09a448a4790c7fec33ba86b6d9b3e6'
    )
  ).toThrowError('Expected label hash to have a length of 66')

  expect(() =>
    encodeLabelHash(
      '12a5ae37e4e1678eb9b22dd4be5ae84226b09a448a4790c7fec33ba86b6d9b3e65'
    )
  ).toThrowError('Expected label hash to start with 0x')
})

test('test decode labelhash', () => {
  expect(
    decodeLabelHash(
      '[a5ae37e4e1678eb9b22dd4be5ae84226b09a448a4790c7fec33ba86b6d9b3e65]'
    )
  ).toBe('a5ae37e4e1678eb9b22dd4be5ae84226b09a448a4790c7fec33ba86b6d9b3e65')

  expect(() =>
    decodeLabelHash(
      '[a5ae37e4e1678eb9b22dd4be5ae84226b09a448a4790c7fec33ba86b6d9b3e6]'
    )
  ).toThrowError('Expected encoded labelhash to have a length of 66')

  expect(() =>
    decodeLabelHash(
      '(a5ae37e4e1678eb9b22dd4be5ae84226b09a448a4790c7fec33ba86b6d9b3e6)'
    )
  ).toThrowError(
    'Expected encoded labelhash to start and end with square brackets'
  )
})

test('test isEncodedLabelHash', () => {
  expect(
    isEncodedLabelHash(
      '[a5ae37e4e1678eb9b22dd4be5ae84226b09a448a4790c7fec33ba86b6d9b3e65]'
    )
  ).toBe(true)

  expect(
    isEncodedLabelHash(
      '0xa5ae37e4e1678eb9b22dd4be5ae84226b09a448a4790c7fec33ba86b6d9b3e65'
    )
  ).toBe(false)

  expect(isEncodedLabelHash('123')).toBe(false)
  expect(isEncodedLabelHash('[123]')).toBe(false)
})

test('test isDecrypted', () => {
  expect(
    isDecrypted(
      '[663072b30dcab381fd7418a1cbe2746c2dd42d79b3d0982109e624ff5d8d1d8d].eth'
    )
  ).toBe(false)

  expect(isDecrypted('arachnid.eth')).toBe(true)

  expect(isDecrypted('eth')).toBe(true)
  expect(isDecrypted('super.vitalik.eth')).toBe(true)
  expect(
    isDecrypted(
      'arachnid.[4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0]'
    )
  ).toBe(false)
  expect(
    isDecrypted(
      '[663072b30dcab381fd7418a1cbe2746c2dd42d79b3d0982109e624ff5d8d1d8d].[4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0]'
    )
  ).toBe(false)
})

test('test namehash', () => {
  expect(
    namehash(
      '[663072b30dcab381fd7418a1cbe2746c2dd42d79b3d0982109e624ff5d8d1d8d].eth'
    )
  ).toBe('0x89e11c9f4e589de37ebe0ea626ffdcefaca07d90bac8e1e89db3661f43da0346')

  expect(namehash('arachnid.eth')).toBe(
    '0x89e11c9f4e589de37ebe0ea626ffdcefaca07d90bac8e1e89db3661f43da0346'
  )
})

test('test labelhash', () => {
  expect(labelhash('eth')).toBe(
    '0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0'
  )

  expect(
    labelhash(
      '[4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0]'
    )
  ).toBe('0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0')
})
