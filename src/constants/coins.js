const coinInfo = {
  BTC: {
    index: 0,
    symbol: 'BTC',
    name: 'Bitcoin'
  },
  LTC: {
    index: 2,
    symbol: 'LTC',
    name: 'Litecoin'
  },
  ETH: {
    index: 60,
    symbol: 'ETH',
    name: 'Ethereum'
  },
  ETC: {
    index: 61,
    symbol: 'ETC',
    name: 'Ethereum Classic'
  },
  RSK: {
    index: 137,
    symbol: 'RSK',
  },
  MONA: {
    index: 22,
    symbol: 'MONA',
  },
  BNB: {
    index: 714,
    symbol: 'BNB'
  },
  DOGE: {
    index: 3,
    symbol: 'DOGE'
  },
  BCH: {
    index: 145,
    symbol: 'BCH'
  },
  XRP: {
    index: 144,
    symbol: 'XRP',
  }
}

export const coinList = Object.keys(coinInfo)

export default coinInfo
