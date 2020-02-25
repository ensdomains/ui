import { Contract } from 'ethers'
import { getWeb3, getNetworkId, getProvider } from './web3'
import { abi as ensContract } from '@ensdomains/ens/build/contracts/ENS.json'
import { abi as reverseRegistrarContract } from '@ensdomains/ens/build/contracts/ReverseRegistrar.json'
import { abi as oldResolverContract } from '@ensdomains/ens-022/build/contracts/PublicResolver.json'
import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/Resolver.json'
import { abi as testRegistrarContract } from '@ensdomains/ens/build/contracts/TestRegistrar.json'
import { abi as dnsRegistrarContract } from '@ensdomains/dnsregistrar/build/contracts/DNSRegistrar.json'

function getReverseRegistrarContract({ address, provider }) {
  return new Contract(address, reverseRegistrarContract, provider)
}

function getResolverContract({ address, provider }) {
  return new Contract(address, resolverContract, provider)
}

function getOldResolverContract({ address, provider }) {
  return new Contract(address, oldResolverContract, provider)
}

function getENSContract({ address, provider }) {
  return new Contract(address, ensContract, provider)
}

function getTestRegistrarContract({ address, provider }) {
  return new Contract(address, testRegistrarContract, provider)
}

function getDnsRegistrarContract({ address, provider }) {
  return new Contract(parentOwner, dnsRegistrarContract, provider)
}

export {
  getTestRegistrarContract,
  getReverseRegistrarContract,
  getENSContract,
  getResolverContract,
  getOldResolverContract,
  getDnsRegistrarContract
}
