import {
  validateName,
  encodeLabelHash,
  decodeLabelHash,
  isEncodedLabelHash,
  namehash
} from '../utils'

test('test valid names', () => {
  expect(validateName('vitalik')).toBe('vitalik')
  expect(validateName('Vitalik')).toBe('vitalik')
  expect(validateName('Vitalik.eth')).toBe('vitalik.eth')
  expect(validateName('sub.Vitalik.eth')).toBe('sub.vitalik.eth')
})

test('test invalid names', () => {
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
