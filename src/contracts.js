import { Contract } from 'ethers'
import { abi as ensContract } from '@ensdomains/ens-archived-contracts/abis/ens/ENS.json'
import { abi as reverseRegistrarContract } from '@ensdomains/ens-archived-contracts/abis/ens/ReverseRegistrar.json'
import { abi as oldResolverContract } from '@ensdomains/ens-archived-contracts/abis/ens-022/PublicResolver.json'
import { abi as resolverContract } from '@ensdomains/ens-archived-contracts/abis/resolver/Resolver.json'
import { abi as testRegistrarContract } from '@ensdomains/ens-archived-contracts/abis/ens/TestRegistrar.json'
import { abi as dnsRegistrarContract } from '@ensdomains/ens-archived-contracts/abis/dnsregistrar/DNSRegistrar.json'
import { abi as legacyAuctionRegistrarContract } from '@ensdomains/ens-archived-contracts/abis/ens/HashRegistrar'
import { abi as deedContract } from '@ensdomains/ens-archived-contracts/abis/ens/Deed'
import { abi as permanentRegistrarContract } from '@ensdomains/ens-archived-contracts/abis/ethregistrar/BaseRegistrarImplementation'
import { abi as permanentRegistrarControllerContract } from '@ensdomains/ens-archived-contracts/abis/ethregistrar/ETHRegistrarController'
import { abi as bulkRenewalContract } from '@ensdomains/ens-archived-contracts/abis/ethregistrar/BulkRenewal'

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

function getDnsRegistrarContract({ parentOwner, provider }) {
  return new Contract(parentOwner, dnsRegistrarContract, provider)
}

function getPermanentRegistrarContract({ address, provider }) {
  return new Contract(address, permanentRegistrarContract, provider)
}

function getPermanentRegistrarControllerContract({ address, provider }) {
  return new Contract(address, permanentRegistrarControllerContract, provider)
}

function getDeedContract({ address, provider }) {
  return new Contract(address, deedContract, provider)
}

function getLegacyAuctionContract({ address, provider }) {
  return new Contract(address, legacyAuctionRegistrarContract, provider)
}

function getBulkRenewalContract({ address, provider }) {
  return new Contract(address, bulkRenewalContract, provider)
}

export {
  getTestRegistrarContract,
  getReverseRegistrarContract,
  getENSContract,
  getResolverContract,
  getOldResolverContract,
  getDnsRegistrarContract,
  getPermanentRegistrarContract,
  getPermanentRegistrarControllerContract,
  getLegacyAuctionContract,
  getDeedContract,
  getBulkRenewalContract
}
