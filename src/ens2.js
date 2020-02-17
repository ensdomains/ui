import has from 'lodash/has'
import { Contract, utils } from 'ethers'
import { getWeb3, getNetworkId, getProvider } from './web3'
import { normalize } from 'eth-ens-namehash'
import { namehash } from './utils'
import { labelhash } from './utils'
import { abi as ensContract } from '@ensdomains/ens/build/contracts/ENS.json'
import { abi as reverseRegistrarContract } from '@ensdomains/ens/build/contracts/ReverseRegistrar.json'
import { abi as oldResolverContract } from '@ensdomains/ens-022/build/contracts/PublicResolver.json'
import { abi as resolverContract } from '@ensdomains/resolver/build/contracts/Resolver.json'
import { abi as fifsRegistrarContract } from '@ensdomains/ens/build/contracts/FIFSRegistrar.json'
import { abi as testRegistrarContract } from '@ensdomains/ens/build/contracts/TestRegistrar.json'
import { abi as dnsRegistrarContract } from '@ensdomains/dnsregistrar/build/contracts/DNSRegistrar.json'


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

  constructor({ networkId, ensAddress }) {
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
}