import { Contract } from 'ethers'
import { getWeb3, getNetworkId, getProvider } from './web3'
import { abi as ensContract } from '@ensdomains/ens/build/contracts/ENS.json'
import { abi as reverseRegistrarContract } from '@ensdomains/ens/build/contracts/ReverseRegistrar.json'
import { abi as oldResolverContract } from '@ensdomains/ens-022/build/contracts/PublicResolver.json'
import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/Resolver.json'
import { abi as testRegistrarContract } from '@ensdomains/ens/build/contracts/TestRegistrar.json'
import { abi as dnsRegistrarContract } from '@ensdomains/dnsregistrar/build/contracts/DNSRegistrar.json'

async function getReverseRegistrarContract(reverseRegistrarAddr) {
  const provider = await getProvider()
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
  const resolver = new Contract(addr, resolverContract, provider)
  return resolver
}

async function getOldResolverContract(addr) {
  const provider = await getProvider()
  const resolver = new Contract(addr, oldResolverContract, provider)
  return resolver
}

function getENSContract({ address, provider }) {
  return new Contract(address, ensContract, provider)
}

async function getTestRegistrarContract(testRegistrarAddr) {
  // const ENS = await getENS()
  // const provider = await getProvider()
  // const namehash = getNamehash('test')
  //const testRegistrarAddr = await ENS.owner(namehash)
  const registrar = new Contract(
    testRegistrarAddr,
    testRegistrarContract,
    provider
  )

  return {
    registrar
  }
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
  getTestRegistrarContract,
  getReverseRegistrarContract,
  getENSContract,
  getResolverContract,
  getOldResolverContract,
  getDnsRegistrarContract
}
