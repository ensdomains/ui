const coinInfo = {
  BTC: {
    index: 0,
    symbol: 'BTC',
    base: 58,
    name: 'Bitcoin',
    encoding: 'base58check'
  },
  LTC: {
    index: 2,
    symbol: 'LTC',
    base: 58,
    name: 'Litecoin',
    encoding: 'base58check'
  },
  ETH: {
    index: 60,
    symbol: 'ETH',
    base: 16,
    name: 'Ethereum',
    encoding: 'hex-checksum'
  },
  ETC: {
    index: 61,
    symbol: 'ETC',
    base: 16,
    name: 'Ethereum Classic',
    encoding: 'hex-checksum'
  }
}

export const coinList = Object.keys(coinInfo)

export default coinInfo
