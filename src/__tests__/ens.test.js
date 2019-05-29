/**
 * @jest-environment node
 */
import GanacheCLI from 'ganache-cli'
import { setupWeb3, getAccounts } from '../web3'
import { deployENS } from '@ensdomains/mock'
import {
  getOwner,
  setOwner,
  setSubnodeOwner,
  getResolver,
  setResolver,
  getAddr,
  setAddress,
  getContent,
  setContent,
  createSubdomain,
  deleteSubdomain,
  getDomainDetails,
  getSubDomains,
  getName,
  claimAndSetReverseRecordName
} from '../registry'
import { getENS, getNamehash } from '../ens'
import '../testing-utils/extendExpect'
import Web3 from 'web3'

const ENVIRONMENTS = ['GANACHE_GUI', 'GANACHE_CLI', 'GANACHE_CLI_MANUAL']
const ENV = ENVIRONMENTS[1]

let reverseRegistrar
let baseRegistrar

describe('Blockchain tests', () => {
  beforeAll(async () => {
    switch (ENV) {
      case 'GANACHE_CLI':
        var provider = GanacheCLI.provider()
        var web3 = await setupWeb3({ provider, Web3 })
        break
      case 'GANACHE_GUI':
        var provider = new Web3.providers.HttpProvider('http://localhost:7545')
        var web3 = await setupWeb3({ provider, Web3 })
        break
      case 'GANACHE_CLI_MANUAL':
        var provider = new Web3.providers.HttpProvider('http://localhost:8545')
        var web3 = await setupWeb3({ provider, Web3 })
        break
      default:
        const options = ENVIRONMENTS.join(' or ')
        throw new Error(`ENV not set properly, please pick from ${options}`)
    }

    const accounts = await getAccounts()
    expect(accounts.length).toBeGreaterThan(0)

    const {
      ensAddress,
      reverseRegistrarAddress,
      baseRegistrarAddress
    } = await deployENS({
      web3,
      accounts
    })

    baseRegistrar = baseRegistrarAddress
    reverseRegistrar = reverseRegistrarAddress

    await getENS(ensAddress)
  }, 100000)

  describe('Test contract and Web3 setup', () => {
    test('accounts exist', async () => {
      const accounts = await getAccounts()
      expect(accounts.length).toBeGreaterThan(0)
    })

    test('ens registry, resolver and reverse registrar deployed', async () => {
      const { ENS } = await getENS()
      const accounts = await getAccounts()

      const eth = getNamehash('eth')
      const ethOwner = await ENS.owner(eth).call()
      expect(ethOwner).toBe(baseRegistrar)

      const reverse = getNamehash('reverse')
      const reverseOwner = await ENS.owner(reverse).call()
      expect(reverseOwner).toBe(accounts[0])

      const reverseNode = getNamehash('addr.reverse')
      const reverseNodeOwner = await ENS.owner(reverseNode).call()
      expect(reverseNodeOwner).toBe(reverseRegistrar)
    })
  })

  describe('Registry', () => {
    test('getOwner returns owner', async () => {
      const accounts = await getAccounts()
      const owner = await getOwner('reverse')
      expect(owner).toBe(accounts[0])
    })

    test('setSubnodeOwner sets new subnode owner', async () => {
      const owner = await getOwner('subnode.resolver.eth')
      const accounts = await getAccounts()
      expect(owner).toBe('0x0000000000000000000000000000000000000000')
      const tx = await setSubnodeOwner('subnode', 'resolver.eth', accounts[0])
      await tx()
      const newOwner = await getOwner('subnode.resolver.eth')
      expect(newOwner).toBe(accounts[0])
    })

    test('setNewOwner sets new owner', async () => {
      const owner = await getOwner('givethisaway.awesome.eth')
      const accounts = await getAccounts()
      expect(owner).toBe('0x0000000000000000000000000000000000000000')
      const tx = await setSubnodeOwner(
        'givethisaway',
        'awesome.eth',
        accounts[0]
      )
      await tx()
      const owner2 = await getOwner('givethisaway.awesome.eth')
      expect(owner2).toBe(accounts[0])
      const tx2 = await setOwner('givethisaway.awesome.eth', accounts[1])
      await tx2()
      const newOwner = await getOwner('givethisaway.awesome.eth')
      expect(newOwner).toBe(accounts[1])
    })

    test('getResolver returns a resolver address when set', async () => {
      const resolver = await getResolver('resolver.eth')
      expect(resolver).toBeHex()
      expect(resolver).toBeEthAddress()
      expect(resolver).not.toBe('0x0000000000000000000000000000000000000000')
    })

    test('getResolver returns 0x00... when resolver address is not set', async () => {
      const resolver = await getResolver('reverse')
      expect(resolver).toBeHex()
      expect(resolver).toBeEthAddress()
      expect(resolver).toBe('0x0000000000000000000000000000000000000000')
    })

    test('setResolver sets the resolver on a node', async () => {
      //test setResolver
      const resolver = await getResolver('awesome.eth')
      const mockResolver = '0x0000000000000000000000000000000000abcdef'
      expect(resolver).not.toBe(mockResolver)

      const tx = await setResolver('awesome.eth', mockResolver)
      await tx()
      const newResolver = await getResolver('awesome.eth')
      expect(newResolver).toBeHex()
      expect(newResolver).toBeEthAddress()
      expect(newResolver.toLowerCase()).toBe(mockResolver)
    })

    test('createSubdomain makes a new subdomain', async () => {
      const accounts = await getAccounts()
      const oldOwner = await getOwner('a.subdomain.eth')
      // expect the initial owner to be no one
      expect(oldOwner).toBe('0x0000000000000000000000000000000000000000')
      const tx = await createSubdomain('new', 'resolver.eth')
      await tx()
      const newOwner = await getOwner('new.resolver.eth')
      // Verify owner is the user and therefore the subdomain exists
      expect(newOwner).toBe(accounts[0])
    })

    test('deleteSubdomain deletes a subdomain', async () => {
      const accounts = await getAccounts()
      const oldOwner = await getOwner('b.subdomain.eth')
      // expect the initial owner to be no one
      expect(oldOwner).toBe('0x0000000000000000000000000000000000000000')
      const tx = await createSubdomain('b', 'subdomain.eth')
      await tx()
      const newOwner = await getOwner('b.subdomain.eth')
      // Verify owner is the user and therefore the subdomain exists
      expect(newOwner).toBe(accounts[0])
      const tx2 = await deleteSubdomain('b', 'subdomain.eth')
      await tx2()
      const deletedOwner = await getOwner('b.subdomain.eth')
      // Verify owner has been set to 0x00... to ensure deletion
      expect(deletedOwner).toBe('0x0000000000000000000000000000000000000000')
    })
  })

  describe('Resolver', () => {
    test('getAddr returns an address', async () => {
      const addr = await getAddr('resolver.eth')
      expect(addr).toBeHex()
      expect(addr).toBeEthAddress()
      expect(addr).not.toBe('0x0000000000000000000000000000000000000000')
    })

    test('getAddr returns 0x000', async () => {
      const tx = await createSubdomain('addr', 'testing.eth')
      await tx()
      const resolverAddr = await getAddr('resolver.eth')
      const tx2 = await setResolver('addr.testing.eth', resolverAddr)
      await tx2()
      const addr = await getAddr('addr.testing.eth')
      expect(addr).toBe('0x0000000000000000000000000000000000000000')
    })

    test('setAddr sets an address', async () => {
      //reverts if no addr is present
      const resolverAddr = await getAddr('resolver.eth')
      const tx = await setResolver('superawesome.eth', resolverAddr)
      await tx()
      const tx2 = await setAddress(
        'superawesome.eth',
        '0x0000000000000000000000000000000000012345'
      )
      await tx2()
      const addr = await getAddr('superawesome.eth')
      expect(addr).toBe('0x0000000000000000000000000000000000012345')
    })

    // test('getContent returns a 32 byte hash', async () => {
    //   await createSubdomain('content', 'testing.eth')
    //   const content = await getContent('content.testing.eth')
    //   expect(content).toBeHex()
    //   expect(content).toMatchSnapshot()
    // })

    // test('getContent returns 0x00... when no content has been set', async () => {
    //   const content = await getContent('superawesome.eth')
    //   expect(content).toBe(
    //     '0x0000000000000000000000000000000000000000000000000000000000000000'
    //   )
    // })

    // test('setContent sets 32 byte hash', async () => {
    //   await setContent(
    //     'superawesome.eth',
    //     '0x736f6d65436f6e74656e74000000000000000000000000000000000000000000'
    //   )

    //   const content = await getContent('superawesome.eth')
    //   expect(content).toBeHex()
    //   expect(content).toMatchSnapshot()
    // })
  })

  describe('Reverse Registrar', () => {
    test('reverseNode is owned by reverseRegistrar', async () => {
      const owner = await getOwner('addr.reverse')
      expect(reverseRegistrar).toBe(owner)
    })

    test('getName gets a name for an address', async () => {
      const accounts = await getAccounts()
      const { name } = await getName(accounts[2])
      expect(name).toBe('eth')
    })

    test('claimAndSetReverseRecordName claims and sets a name', async () => {
      const accounts = await getAccounts()
      const { name } = await getName(accounts[0])
      expect(name).toBe('abittooawesome.eth')
      const tx = await claimAndSetReverseRecordName('resolver.eth', 2000000)
      await tx()
      const { name: nameAfter } = await getName(accounts[0])
      expect(nameAfter).toBe('resolver.eth')
    })
  })

  describe('Helper functions', () => {
    test('getDomainDetails gets rootdomain and resolver details', async () => {
      const domain = await getDomainDetails('resolver.eth')
      const accounts = await getAccounts()
      expect(domain.owner).not.toBe(
        '0x0000000000000000000000000000000000000000'
      )
      expect(domain.owner).toBeEthAddress()
      expect(domain.resolver).not.toBe(
        '0x0000000000000000000000000000000000000000'
      )
      expect(domain.resolver).toBeEthAddress()
      const addr = await getAddr('resolver.eth')
      expect(domain.addr).toBe(addr)
      expect(domain.content).toMatchSnapshot()
    })

    test('getSubdomains gets all subdomains', async () => {
      const domains = await getSubDomains('eth')
      expect(domains.length).toBeGreaterThan(0)
      expect(domains[0].label).toBe('subdomain')
    })
  })
})
