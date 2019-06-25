import _ from 'lodash'
import { Contract, utils } from 'ethers'
import { getWeb3, getNetworkId, getSignerOrProvider } from './web3'
import { normalize } from 'eth-ens-namehash'
import { namehash } from './utils'
import { abi as ensContract } from '@ensdomains/ens/build/contracts/ENS.json'
import { abi as reverseRegistrarContract } from '@ensdomains/ens/build/contracts/ReverseRegistrar.json'
import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/Resolver.json'
import { abi as fifsRegistrarContract } from '@ensdomains/ens/build/contracts/FIFSRegistrar.json'
import { abi as testRegistrarContract } from '@ensdomains/ens/build/contracts/TestRegistrar.json'
import { abi as dnsRegistrarContract } from '@ensdomains/dnsregistrar/build/contracts/DNSRegistrar.json'

var contracts = {
  1: {
    registry: '0x314159265dd8dbb310642f98f50c066173c1259b'
  },
  3: {
    registry: '0x112234455c3a32fd11230c42e7bccd4a84e02010'
  },
  4: {
    registry: '0xe7410170f87102df0055eb195163a03b7f2bff4a'
  },
  5: {
    registry: '0x112234455c3a32fd11230c42e7bccd4a84e02010'
  }
}

let ENS
let readENS

function getNamehash(unsanitizedName) {
  return namehash(unsanitizedName)
}

async function getNamehashWithLabelHash(labelHash, nodeHash) {
  let node = utils.keccak256(nodeHash + labelHash.slice(2))
  return node.toString()
}

function getLabelhash(label) {
  return utils.solidityKeccak256(['string'], [label])
}

async function getReverseRegistrarContract() {
  const { ENS } = await getENS()
  const signer = await getSignerOrProvider()
  const namehash = getNamehash('addr.reverse')
  const reverseRegistrarAddr = await ENS.owner(namehash)
  const reverseRegistrar = new Contract(
    reverseRegistrarAddr,
    reverseRegistrarContract,
    signer
  )
  return {
    reverseRegistrar
  }
}

async function getResolverContract(addr) {
  const signer = await getSignerOrProvider()
  const Resolver = new Contract(addr, resolverContract, signer)
  return {
    Resolver
  }
}

async function getENSContract() {
  const networkId = await getNetworkId()
  const signer = await getSignerOrProvider()

  const ENS = new Contract(contracts[networkId].registry, ensContract, signer)
  return {
    readENS: ENS,
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
  const { ENS } = await getENS()
  const provider = await getWeb3()
  const namehash = getNamehash('test')
  const testRegistrarAddr = await ENS.owner(namehash)
  const registrar = new web3.eth.Contract(
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

  //TODO: remove
  if (process.env.REACT_APP_ENS_ADDRESS && networkId > 1000) {
    //Assuming public main/test networks have a networkId of less than 1000
    ensAddress = process.env.REACT_APP_ENS_ADDRESS
  }

  const hasRegistry = _.has(contracts[networkId], 'registry')

  if (!ENS) {
    if (!hasRegistry && !ensAddress) {
      throw new Error(`Unsupported network ${networkId}`)
    }

    if (contracts[networkId]) {
      ensAddress = contracts[networkId].registry
    }

    contracts[networkId] = {}
    contracts[networkId].registry = ensAddress
  } else {
    return {
      ENS: ENS,
      _ENS: ENS,
      readENS: readENS,
      _readENS: readENS
    }
  }

  const { ENS: ENSContract, readENS: readENSContract } = await getENSContract()
  ENS = ENSContract
  readENS = readENSContract

  return {
    ENS: ENSContract,
    _ENS: ENSContract,
    readENS: readENS,
    _readENS: readENS
  }
}

async function getENSEvent(event, { topics, fromBlock }) {
  const provider = await getWeb3()
  const { ENS } = await getENS()
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

async function getDnsRegistrarContract(name) {
  const { ENS, web3 } = await getENS()
  const provider = await getWeb3()
  const namehash = getNamehash(name)
  const address = await ENS.owner(namehash)
  const registrar = new Contract(address,dnsRegistrarContract, provider)
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
