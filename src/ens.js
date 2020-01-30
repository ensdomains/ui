import has from 'lodash/has'
import { Contract, utils } from 'ethers'
import { getWeb3, getNetworkId, getProvider } from './web3'
import { normalize } from 'eth-ens-namehash'
import { namehash } from './utils'
import { labelhash } from './utils'
import { abi as ensContract } from '@ensdomains/ens/build/contracts/ENS.json'
import { abi as reverseRegistrarContract } from '@ensdomains/ens/build/contracts/ReverseRegistrar.json'
import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/PublicResolver.json'
// Temporarily put back to PublicResolver, as Resolver only had setName for some reson.
// import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/Resolver.json'
import { abi as fifsRegistrarContract } from '@ensdomains/ens/build/contracts/FIFSRegistrar.json'
import { abi as testRegistrarContract } from '@ensdomains/ens/build/contracts/TestRegistrar.json'
import { abi as dnsRegistrarContract } from '@ensdomains/dnsregistrar/build/contracts/DNSRegistrar.json'

var contracts = {
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

let ENS

function getNamehash(unsanitizedName) {
  return namehash(unsanitizedName)
}

async function getNamehashWithLabelHash(labelHash, nodeHash) {
  let node = utils.keccak256(nodeHash + labelHash.slice(2))
  return node.toString()
}

function getLabelhash(label) {
  return labelhash(label)
}

async function getReverseRegistrarContract() {
  const ENS = await getENS()
  const provider = await getProvider()
  const namehash = getNamehash('addr.reverse')
  const reverseRegistrarAddr = await ENS.owner(namehash)
  const reverseRegistrar = new Contract(
    reverseRegistrarAddr,
    reverseRegistrarContract,
    provider
  )
  return {
    reverseRegistrar
  }
}

async function getResolverContract(addr) {
  const provider = await getProvider()
  return new Contract(addr, resolverContract, provider)
}

async function getENSContract() {
  const networkId = await getNetworkId()
  const provider = await getProvider()

  const ENS = new Contract(contracts[networkId].registry, ensContract, provider)
  return {
    ENS: ENS
  }
}

async function getFifsRegistrarContract() {
  const { ENS, web3 } = await getENS()

  const fifsRegistrarAddr = await ENS.owner('test')

  return {
    registrar: new Contract(fifsRegistrarContract, fifsRegistrarAddr),
    web3
  }
}

async function getTestRegistrarContract() {
  const ENS = await getENS()
  const provider = await getProvider()
  const namehash = getNamehash('test')
  const testRegistrarAddr = await ENS.owner(namehash)
  const registrar = new Contract(
    testRegistrarAddr,
    testRegistrarContract,
    provider
  )

  return {
    registrar
  }
}

const getENS = async ensAddress => {
  const networkId = await getNetworkId()

  const hasRegistry = has(contracts[networkId], 'registry')

  if (!ENS) {
    if (!hasRegistry && !ensAddress) {
      throw new Error(`Unsupported network ${networkId}`)
    } else if (contracts[networkId] && !ensAddress) {
      ensAddress = contracts[networkId].registry
    }

    contracts[networkId] = {}
    contracts[networkId].registry = ensAddress
  } else {
    return ENS
  }

  const { ENS: ENSContract } = await getENSContract()
  ENS = ENSContract

  return ENS
}

async function getENSEvent(event, { topics, fromBlock }) {
  const provider = await getWeb3()
  const ENS = await getENS()
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

async function getDnsRegistrarContract(parentOwner) {
  const provider = await getProvider()
  const registrar = new Contract(parentOwner, dnsRegistrarContract, provider)
  return {
    registrar: registrar,
    web3
  }
}

export {
  getENS,
  getTestRegistrarContract,
  getReverseRegistrarContract,
  getENSContract,
  getENSEvent,
  getLabelhash,
  getNamehash,
  getNamehashWithLabelHash,
  getResolverContract,
  getDnsRegistrarContract,
  getFifsRegistrarContract,
  normalize
}
