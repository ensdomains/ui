import has from 'lodash/has'
import { Contract, utils } from 'ethers'
import { getWeb3, getNetworkId, getProvider } from './web3'
import { normalize } from 'eth-ens-namehash'
import { namehash } from './utils'
import { labelhash } from './utils'

import {
  getTestRegistrarContract,
  getReverseRegistrarContract,
  getENSContract,
  getResolverContract,
  getOldResolverContract,
  getDnsRegistrarContract,
  getFifsRegistrarContract
} from './contracts'

/* Utils */

function getNamehash(name) {
  return namehash
}

async function getNamehashWithLabelHash(labelHash, nodeHash) {
  let node = utils.keccak256(nodeHash + labelHash.slice(2))
  return node.toString()
}

function getLabelhash(label) {
  return labelhash(label)
}

export default class ENS {
  contracts = {
    1: {
      registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
    },
    3: {
      registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
    },
    4: {
      registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
    },
    5: {
      registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
    }
  }

  async constructor({ networkId, ensAddress }) {
    const networkId = await getNetworkId()
    const hasRegistry = has(this.contracts[networkId], 'registry')

    if (!hasRegistry && !ensAddress) {
      throw new Error(`Unsupported network ${networkId}`)
    } else if (this.contracts[networkId] && !ensAddress) {
      ensAddress = contracts[networkId].registry
    }
    this.contracts[networkId].registry = ensAddress

    const { ENS: ENSContract } = await getENSContract()
    this.ENS = ENSContract
  }

  /* Main methods */

  async getOwner(name) {
    const namehash = getNamehash(name)
    const owner = await this.ENS.owner(namehash)
    return owner
  }

  async getResolver(name) {
    const namehash = getNamehash(name)
    return this.ENS.resolver(namehash)
  }

  async getTTL(name) {
    const namehash = getNamehash(name)
    return this.ENS.ttl(namehash)
  }

  async getResolverWithLabelhash(labelhash, nodehash) {
    const namehash = await getNamehashWithLabelHash(labelhash, nodehash)
    return this.ENS.resolver(namehash)
  }

  async getOwnerWithLabelHash(labelhash, nodeHash) {
    const namehash = await getNamehashWithLabelHash(labelhash, nodeHash)
    return this.ENS.owner(namehash)
  }

  async getEthAddressWithResolver(name, resolverAddr) {
    if (parseInt(resolverAddr, 16) === 0) {
      return emptyAddress
    }
    const namehash = getNamehash(name)
    try {
      const Resolver = await getResolverContract(resolverAddr)
      const addr = await Resolver['addr(bytes32)'](namehash)
      return addr
    } catch (e) {
      console.warn(
        'Error getting addr on the resolver contract, are you sure the resolver address is a resolver contract?'
      )
      return emptyAddress
    }
  }

  async getAddress(name) {
    const resolverAddr = await this.getResolver(name)
    return this.getEthAddressWithResolver(name, resolverAddr)
  }

  async getAddr(name, key) {
    const resolverAddr = await this.getResolver(name)
    if (parseInt(resolverAddr, 16) === 0) return emptyAddress
    return getAddrWithResolver(name, key, resolverAddr)
  }

  async getAddrWithResolver(name, key, resolverAddr) {
    const namehash = getNamehash(name)
    try {
      const Resolver = await getResolverContract(resolverAddr)
      const { coinType, encoder } = formatsByName[key]
      const addr = await Resolver['addr(bytes32,uint256)'](namehash, coinType)
      if (addr === '0x') return emptyAddress

      return encoder(Buffer.from(addr.slice(2), 'hex'))
    } catch (e) {
      console.log(e)
      console.warn(
        'Error getting addr on the resolver contract, are you sure the resolver address is a resolver contract?'
      )
      return emptyAddress
    }
  }

  async getContent(name) {
    const resolverAddr = await this.getResolver(name)
    return this.getContentWithResolver(name, resolverAddr)
  }

  async getContentWithResolver(name, resolverAddr) {
    if (parseInt(resolverAddr, 16) === 0) {
      return emptyAddress
    }
    try {
      const namehash = getNamehash(name)
      const Resolver = await getResolverContract(resolverAddr)
      const contentHashSignature = utils
        .solidityKeccak256(['string'], ['contenthash(bytes32)'])
        .slice(0, 10)

      const isContentHashSupported = await Resolver.supportsInterface(
        contentHashSignature
      )

      if (isContentHashSupported) {
        const { protocolType, decoded, error } = decodeContenthash(
          await Resolver.contenthash(namehash)
        )
        if (error) {
          return {
            value: emptyAddress,
            contentType: 'contenthash'
          }
        }
        return {
          value: `${protocolType}://${decoded}`,
          contentType: 'contenthash'
        }
      } else {
        const value = await Resolver.content(namehash)
        return {
          value,
          contentType: 'oldcontent'
        }
      }
    } catch (e) {
      const message =
        'Error getting content on the resolver contract, are you sure the resolver address is a resolver contract?'
      console.warn(message, e)
      return { value: message, contentType: 'error' }
    }
  }

  async getText(name, key) {
    const resolverAddr = await this.getResolver(name)
    return this.getTextWithResolver(name, key, resolverAddr)
  }

  async getTextWithResolver(name, key, resolverAddr) {
    if (parseInt(resolverAddr, 16) === 0) {
      return ''
    }
    const namehash = getNamehash(name)
    try {
      const Resolver = await getResolverContract(resolverAddr)
      const addr = await Resolver.text(namehash, key)
      return addr
    } catch (e) {
      console.warn(
        'Error getting text record on the resolver contract, are you sure the resolver address is a resolver contract?'
      )
      return ''
    }
  }

  async getName(address) {
    const reverseNode = `${address.slice(2)}.addr.reverse`
    const resolverAddr = await this.getResolver(reverseNode)
    return this.getNameWithResolver(address, resolverAddr)
  }

  async getNameWithResolver(address, resolverAddr) {
    const reverseNode = `${address.slice(2)}.addr.reverse`
    const reverseNamehash = getNamehash(reverseNode)
    if (parseInt(resolverAddr, 16) === 0) {
      return {
        name: null
      }
    }

    try {
      const Resolver = await getResolverContract(resolverAddr)
      const name = await Resolver.name(reverseNamehash)
      return {
        name
      }
    } catch (e) {
      console.log(`Error getting name for reverse record of ${address}`, e)
    }
  }

  // Events

  async getENSEvent(event, { topics, fromBlock }) {
    const provider = await getWeb3()
    const { ENS } = this
    const ensInterface = new utils.Interface(ensContract)
    let Event = ENS.filters[event]()

    const filter = {
      fromBlock,
      toBlock: 'latest',
      address: Event.address,
      topics: [...Event.topics, ...topics]
    }

    const logs = await provider.getLogs(filter)

    const parsed = logs.map(log => {
      const parsedLog = ensInterface.parseLog(log)
      return parsedLog
    })

    return parsed
  }
}

export {
  getENS,
  getENSContract,
  getENSEvent,
  getLabelhash,
  getNamehash,
  getNamehashWithLabelHash,
  normalize
}
