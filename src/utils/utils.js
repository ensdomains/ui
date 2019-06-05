import { getNetworkId } from '../web3'
import { addressUtils } from '@0xproject/utils'
import { tlds } from '../constants/tlds'
import { normalize } from 'eth-ens-namehash'
const sha3 = require('js-sha3').keccak_256

//import { checkLabelHash } from '../updaters/preImageDB'

export const uniq = (a, param) =>
  a.filter(
    (item, pos) => a.map(mapItem => mapItem[param]).indexOf(item[param]) === pos
  )

export async function getEtherScanAddr() {
  const networkId = await getNetworkId()
  switch (networkId) {
    case 1:
    case '1':
      return 'https://etherscan.io/'
    case 3:
    case '3':
      return 'https://ropsten.etherscan.io/'
    case 4:
    case '4':
      return 'https://rinkeby.etherscan.io/'
    default:
      return 'https://etherscan.io/'
  }
}

export async function ensStartBlock() {
  const networkId = await getNetworkId()
  switch (networkId) {
    case 1:
    case '1':
      return 3327417
    case 3:
    case '3':
      return 25409
    default:
      return 0
  }
}

export const checkLabels = (...labelHashes) => labelHashes.map(hash => null)

// export const checkLabels = (...labelHashes) =>
//   labelHashes.map(labelHash => checkLabelHash(labelHash) || null)

export const mergeLabels = (labels1, labels2) =>
  labels1.map((label, index) => (label ? label : labels2[index]))

export function validateName(name) {
  const nameArray = name.split('.')
  const hasEmptyLabels = nameArray.filter(e => e.length < 1).length > 0
  if (hasEmptyLabels) throw new Error('Domain cannot have empty labels')
  const normalizedArray = nameArray.map(label => {
    return isEncodedLabelHash(label) ? label : normalize(label)
  })
  try {
    return normalizedArray.join('.')
  } catch (e) {
    throw e
  }
}

export function isLabelValid(name) {
  try {
    validateName(name)
    if (name.indexOf('.') === -1) {
      return true
    }
  } catch (e) {
    console.log(e)
    return false
  }
}

export const parseSearchTerm = term => {
  let regex = /[^.]+$/

  try {
    validateName(term)
  } catch (e) {
    return 'invalid'
  }

  if (term.indexOf('.') !== -1) {
    const termArray = term.split('.')
    const tld = term.match(regex) ? term.match(regex)[0] : ''

    if (tlds[tld] && tlds[tld].supported) {
      if (tld === 'eth' && termArray[termArray.length - 2].length < 7) {
        return 'short'
      }
      return 'supported'
    }

    return 'unsupported'
  } else if (addressUtils.isAddress(term)) {
    return 'address'
  } else {
    //check if the search term is actually a tld
    if (Object.keys(tlds).filter(tld => term === tld).length > 0) {
      return 'tld'
    }
    return 'search'
  }
}

export function modulate(value, rangeA, rangeB, limit) {
  let fromHigh, fromLow, result, toHigh, toLow
  if (limit == null) {
    limit = false
  }
  fromLow = rangeA[0]
  fromHigh = rangeA[1]
  toLow = rangeB[0]
  toHigh = rangeB[1]
  result = toLow + ((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow)
  if (limit === true) {
    if (toLow < toHigh) {
      if (result < toLow) {
        return toLow
      }
      if (result > toHigh) {
        return toHigh
      }
    } else {
      if (result > toLow) {
        return toLow
      }
      if (result < toHigh) {
        return toHigh
      }
    }
  }
  return result
}

export function isElementInViewport(el) {
  var rect = el.getBoundingClientRect()

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight ||
        document.documentElement.clientHeight) /*or $(window).height() */ &&
    rect.right <=
      (window.innerWidth ||
        document.documentElement.clientWidth) /*or $(window).width() */
  )
}

export const emptyAddress = '0x0000000000000000000000000000000000000000'

export function encodeLabelHash(hash) {
  if (!hash.startsWith('0x')) {
    throw new Error('Expected label hash to start with 0x')
  }

  if (hash.length !== 66) {
    throw new Error('Expected label hash to have a length of 66')
  }

  return `[${hash.slice(2)}]`
}

export function decodeLabelHash(hash) {
  if (!(hash.startsWith('[') && hash.endsWith(']'))) {
    throw Error(
      'Expected encoded labelhash to start and end with square brackets'
    )
  }

  if (hash.length !== 66) {
    throw Error('Expected encoded labelhash to have a length of 66')
  }

  return `${hash.slice(1, -1)}`
}

export function isEncodedLabelHash(hash) {
  return hash.startsWith('[') && hash.endsWith(']') && hash.length === 66
}

export function isDecrypted(name) {
  const nameArray = name.split('.')
  const decrypted = nameArray.reduce((acc, label) => {
    if (acc === false) return false
    return isEncodedLabelHash(label) ? false : true
  }, true)

  return decrypted
}

export function namehash(inputName) {
  let node = ''
  for (let i = 0; i < 32; i++) {
    node += '00'
  }

  if (name) {
    const labels = inputName.split('.')

    for (let i = labels.length - 1; i >= 0; i--) {
      let labelSha
      if (isEncodedLabelHash(labels[i])) {
        labelSha = decodeLabelHash(labels[i])
      } else {
        let normalisedLabel = normalize(labels[i])
        labelSha = sha3(normalisedLabel)
      }
      node = sha3(new Buffer(node + labelSha, 'hex'))
    }
  }

  return '0x' + node
}
