import {
  getENS,
  getNamehash,
  getLabelhash,
  getENSEvent,
  getReverseRegistrarContract,
  getResolverContract,
  getTestRegistrarContract,
  getNamehashWithLabelHash,
  normalize
} from './ens'
import { decryptHashes } from './preimage'
import {
  uniq,
  ensStartBlock,
  checkLabels,
  mergeLabels,
  emptyAddress,
  isDecrypted
} from './utils'

import { encodeLabelhash } from './utils/labelhash'
import { formatsByName } from '@ensdomains/address-encoder'
import coins from './constants/coins'
import {
  isValidContenthash,
  encodeContenthash,
  decodeContenthash
} from './utils/contents'
import { getWeb3, getAccount, getSigner, getNetworkId } from './web3'
import { utils } from 'ethers'

export async function getOwner(name) {
  const { ENS } = await getENS()
  const namehash = getNamehash(name)
  const owner = await ENS.owner(namehash)
  return owner
}

export async function getResolver(name) {
  const namehash = getNamehash(name)
  const { ENS } = await getENS()
  return ENS.resolver(namehash)
}

export async function getResolverWithLabelhash(labelhash, nodehash) {
  let { ENS } = await getENS()
  const namehash = await getNamehashWithLabelHash(labelhash, nodehash)
  return ENS.resolver(namehash)
}

export async function getOwnerWithLabelHash(labelhash, nodeHash) {
  let { ENS } = await getENS()
  const namehash = await getNamehashWithLabelHash(labelhash, nodeHash)
  return ENS.owner(namehash)
}

export async function getAddress(name) {
  const resolverAddr = await getResolver(name)
  if (parseInt(resolverAddr, 16) === 0) {
    return '0x00000000000000000000000000000000'
  }
  const namehash = getNamehash(name)
  try {
    const { Resolver } = await getResolverContract(resolverAddr)
    const addr = await Resolver['addr(bytes32)'](namehash)
    return addr
  } catch (e) {
    console.warn(
      'Error getting addr on the resolver contract, are you sure the resolver address is a resolver contract?'
    )
    return '0x00000000000000000000000000000000'
  }
}

export async function getAddr(name, key) {
  const resolverAddr = await getResolver(name)
  if (parseInt(resolverAddr, 16) === 0) {
    return '0x00000000000000000000000000000000'
  }
  const namehash = getNamehash(name)
  try {
    const { Resolver } = await getResolverContract(resolverAddr)
    const {symbol, index} = coins[key]
    const addr = await Resolver['addr(bytes32,uint256)'](namehash, index)
    if (addr === '0x') return '0x00000000000000000000000000000000'
    const format = formatsByName[symbol]
    const decoded = format.encoder(Buffer.from(addr.slice(2),'hex'))
    return decoded
  } catch (e) {
    console.log(e)
    console.warn(
      'Error getting addr on the resolver contract, are you sure the resolver address is a resolver contract?'
    )
    return '0x00000000000000000000000000000000'
  }
}

export async function getContent(name) {
  const resolverAddr = await getResolver(name)
  if (parseInt(resolverAddr, 16) === 0) {
    return '0x00000000000000000000000000000000'
  }
  try {
    const namehash = getNamehash(name)
    const { Resolver } = await getResolverContract(resolverAddr)
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

export async function getText(name, key) {
  const resolverAddr = await getResolver(name)
  if (parseInt(resolverAddr, 16) === 0) {
    return ''
  }
  const namehash = getNamehash(name)
  try {
    const { Resolver } = await getResolverContract(resolverAddr)
    const addr = await Resolver.text(namehash, key)
    return addr
  } catch (e) {
    console.warn(
      'Error getting text record on the resolver contract, are you sure the resolver address is a resolver contract?'
    )
    return ''
  }
}

export async function getName(address) {
  const reverseNode = `${address.slice(2)}.addr.reverse`
  const reverseNamehash = getNamehash(reverseNode)
  const resolverAddr = await getResolver(reverseNode)
  if (parseInt(resolverAddr, 16) === 0) {
    return {
      name: null
    }
  }

  try {
    const { Resolver } = await getResolverContract(resolverAddr)
    const name = await Resolver.name(reverseNamehash)
    return {
      name
    }
  } catch (e) {
    console.log(`Error getting name for reverse record of ${address}`, e)
  }
}

export async function setOwner(name, newOwner) {
  const { ENS } = await getENS()
  const namehash = getNamehash(name)
  return ENS.setOwner(namehash, newOwner)
}

export async function setSubnodeOwner(unnormalizedName, newOwner) {
  const { ENS } = await getENS()
  const name = normalize(unnormalizedName)
  const nameArray = name.split('.')
  const label = nameArray[0]
  const node = nameArray.slice(1).join('.')
  const labelhash = getLabelhash(label)
  const parentNamehash = getNamehash(node)
  return ENS.setSubnodeOwner(parentNamehash, labelhash, newOwner)
}

export async function setResolver(name, resolver) {
  const namehash = getNamehash(name)
  const { ENS } = await getENS()
  return ENS.setResolver(namehash, resolver)
}

export async function setAddress(name, address) {
  const namehash = getNamehash(name)
  const resolverAddr = await getResolver(name)
  const { Resolver } = await getResolverContract(resolverAddr)
  return Resolver['setAddr(bytes32,address)'](namehash, address)
}

export async function setAddr(name, key, address) {
  const namehash = getNamehash(name)
  const resolverAddr = await getResolver(name)
  const { Resolver } = await getResolverContract(resolverAddr)
  const {symbol, index} = coins[key]
  const format = formatsByName[symbol]
  const addressAsBytes = format.decoder(address)
  return Resolver['setAddr(bytes32,uint256,bytes)'](namehash,index,addressAsBytes)
}

export async function setContent(name, content) {
  const namehash = getNamehash(name)
  const resolverAddr = await getResolver(name)
  const { Resolver } = await getResolverContract(resolverAddr)
  return Resolver.setContent(namehash, content)
}

export async function setContenthash(name, content) {
  const encodedContenthash = encodeContenthash(content)
  const namehash = getNamehash(name)
  const resolverAddr = await getResolver(name)
  const { Resolver } = await getResolverContract(resolverAddr)
  return Resolver.setContenthash(namehash, encodedContenthash)
}

export async function setText(name, key, recordValue) {
  const namehash = getNamehash(name)
  const resolverAddr = await getResolver(name)
  const { Resolver } = await getResolverContract(resolverAddr)
  return Resolver.setText(namehash, key, recordValue)
}

export async function checkSubdomain(subdomain, domain) {
  const { ENS } = await getENS()
  return ENS.owner(subdomain + '.' + domain)
}

export async function createSubdomain(domain) {
  const account = await getAccount()
  try {
    return setSubnodeOwner(domain, account)
  } catch (e) {
    console.log('error creating subdomain', e)
  }
}

export async function deleteSubdomain(name) {
  const resolver = await getResolver(name)
  const account = await getAccount()
  if (parseInt(resolver, 16) !== 0) {
    const tx = await setSubnodeOwner(name, account)
    await tx.wait()
    const tx2 = await setResolver(name, 0)
    await tx2.wait()
  }
  try {
    return setSubnodeOwner(name, '0x0000000000000000000000000000000000000000')
  } catch (e) {
    console.log('error deleting subdomain', e)
  }
}

export async function getResolverDetails(node) {
  try {
    const addrPromise = getAddress(node.name)
    const contentPromise = getContent(node.name)
    const [addr, content] = await Promise.all([addrPromise, contentPromise])
    return {
      ...node,
      addr,
      content: content.value,
      contentType: content.contentType
    }
  } catch (e) {
    return {
      ...node,
      addr: '0x0',
      content: '0x0',
      contentType: 'error'
    }
  }
}

export async function claimAndSetReverseRecordName(name, overrides = {}) {
  const { reverseRegistrar } = await getReverseRegistrarContract()
  const networkId = await getNetworkId()

  if (parseInt(networkId) > 1000) {
    const gasLimit = await reverseRegistrar.estimate.setName(name)
    overrides = {
      gasLimit: gasLimit.toNumber() * 2,
      ...overrides
    }
  }

  return reverseRegistrar.setName(name, overrides)
}

export async function setReverseRecordName(name) {
  const account = await getAccount()
  const reverseNode = `${account.slice(2)}.addr.reverse`
  const resolverAddress = await getResolver(reverseNode)
  let { Resolver } = await getResolverContract(resolverAddress)
  let namehash = getNamehash(reverseNode)
  return Resolver.setName(namehash, name)
}

export async function getDomainDetails(name) {
  const nameArray = name.split('.')
  const labelhash = getLabelhash(nameArray[0])
  const [owner, resolver] = await Promise.all([
    getOwner(name),
    getResolver(name)
  ])
  const node = {
    name,
    label: nameArray[0],
    labelhash,
    owner,
    resolver
  }

  const hasResolver = parseInt(node.resolver, 16) !== 0

  if (hasResolver) {
    return getResolverDetails(node)
  }

  return {
    ...node,
    addr: null,
    content: null
  }
}

export const getSubdomains = async name => {
  const startBlock = await ensStartBlock()
  const namehash = getNamehash(name)
  const rawLogs = await getENSEvent('NewOwner', {
    topics: [namehash],
    fromBlock: startBlock
  })
  const flattenedLogs = rawLogs.map(log => log.values)
  flattenedLogs.reverse()
  const logs = uniq(flattenedLogs, 'label')
  const labelhashes = logs.map(log => log.label)
  const remoteLabels = await decryptHashes(...labelhashes)
  const localLabels = checkLabels(...labelhashes)
  const labels = mergeLabels(localLabels, remoteLabels)
  const ownerPromises = labels.map(label => getOwner(`${label}.${name}`))

  return Promise.all(ownerPromises).then(owners =>
    owners.map((owner, index) => {
      return {
        label: labels[index],
        labelhash: logs[index].label,
        decrypted: labels[index] !== null,
        node: name,
        name: `${labels[index] || encodeLabelhash(logs[index].label)}.${name}`,
        owner
      }
    })
  )
}

export async function registerTestdomain(label) {
  const { registrar } = await getTestRegistrarContract()
  const labelhash = getLabelhash(label)
  const account = await getAccount()
  return registrar.register(labelhash, account)
}

export async function expiryTimes(label, owner) {
  const { registrar } = await getTestRegistrarContract()
  const labelhash = getLabelhash(label)
  const result = await registrar.expiryTimes(labelhash)
  if (result > 0) {
    return new Date(result * 1000)
  }
}
