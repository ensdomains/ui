
import DNSRegistrarJS from './dnsregistrar'
import {
  getENSContract,
  getResolverContract,
  getPermanentRegistrarContract,
  getDnsRegistrarContract,
  getPermanentRegistrarControllerContract,
  getLegacyAuctionContract,
  getDeedContract,
  getTestRegistrarContract,
  getBulkRenewalContract
} from './contracts'

import {
  getAccount,
  getBlock,
  getProvider,
  getSigner,
  getNetworkId,
  getWeb3Read
} from './web3'

import { namehash } from './utils/namehash'

import { interfaces } from './constants/interfaces'
import { isEncodedLabelhash, labelhash } from './utils/labelhash'

const {
  legacyRegistrar: legacyRegistrarInterfaceId,
  permanentRegistrar: permanentRegistrarInterfaceId,
  bulkRenewal: bulkRenewalInterfaceId,
  dnsRegistrar: dnsRegistrarInterfaceId
} = interfaces

function checkArguments({
  registryAddress,
  ethAddress,
  legacyAuctionRegistrarAddress,
  provider
}) {
  if (!registryAddress) throw 'No registry address given to Registrar class'

  if (!legacyAuctionRegistrarAddress)
    throw 'No legacy auction address given to Registrar class'

  if (!ethAddress) throw 'No .eth address given to Registrar class'

  if (!provider) throw 'Provider is required for Registrar'

  return
}

export default class Registrar {
  constructor({
    registryAddress,
    ethAddress,
    legacyAuctionRegistrarAddress,
    controllerAddress,
    bulkRenewalAddress,
    provider
  }) {
    checkArguments({
      registryAddress,
      ethAddress,
      legacyAuctionRegistrarAddress,
      provider
    })

    const permanentRegistrar = getPermanentRegistrarContract({
      address: ethAddress,
      provider
    })
    const permanentRegistrarController = getPermanentRegistrarControllerContract(
      { address: controllerAddress, provider }
    )

    const legacyAuctionRegistrar = getLegacyAuctionContract({
      address: legacyAuctionRegistrarAddress,
      provider
    })

    const bulkRenewal = getBulkRenewalContract({
      address: bulkRenewalAddress,
      provider
    })

    const ENS = getENSContract({ address: registryAddress, provider })

    this.permanentRegistrar = permanentRegistrar
    this.permanentRegistrarController = permanentRegistrarController
    this.legacyAuctionRegistrar = legacyAuctionRegistrar
    this.registryAddress = registryAddress
    this.bulkRenewal = bulkRenewal
    this.ENS = ENS
  }

  async getAddress(name) {
    const provider = await getProvider()
    const hash = namehash(name)
    const resolverAddr = await this.ENS.resolver(hash)
    const Resolver = getResolverContract({ address: resolverAddr, provider })
    return Resolver['addr(bytes32)'](hash)
  }

  async getDeed(address) {
    const provider = await getProvider()
    return getDeedContract({ address, provider })
  }

  async getLegacyEntry(label) {
    let legacyEntry
    try {
      const Registrar = this.legacyAuctionRegistrar
      let deedOwner = '0x0'
      const entry = await Registrar.entries(labelhash(label))
      if (parseInt(entry[1], 16) !== 0) {
        const deed = await this.getDeed(entry[1])
        deedOwner = await deed.owner()
      }
      legacyEntry = {
        deedOwner, // TODO: Display "Release" button if deedOwner is not 0x0
        state: parseInt(entry[0]),
        registrationDate: parseInt(entry[2]) * 1000,
        revealDate: (parseInt(entry[2]) - 24 * 2 * 60 * 60) * 1000,
        value: parseInt(entry[3]),
        highestBid: parseInt(entry[4])
      }
    } catch (e) {
      legacyEntry = {
        deedOwner: '0x0',
        state: 0,
        registrationDate: 0,
        revealDate: 0,
        value: 0,
        highestBid: 0,
        expiryTime: 0,
        error: e.message
      }
    }
    return legacyEntry
  }

  async getPermanentEntry(label) {
    const {
      permanentRegistrar: Registrar,
      permanentRegistrarController: RegistrarController
    } = this

    let getAvailable
    let ret = {
      available: null,
      nameExpires: null
    }
    try {
      const labelHash = labelhash(label)

      // Returns true if name is available
      if (isEncodedLabelhash(label)) {
        getAvailable = Registrar.available(labelHash)
      } else {
        getAvailable = RegistrarController.available(label)
      }

      const [available, nameExpires, gracePeriod] = await Promise.all([
        getAvailable,
        Registrar.nameExpires(labelHash),
        this.getGracePeriod(Registrar)
      ])

      ret = {
        ...ret,
        available,
        gracePeriod,
        nameExpires: nameExpires > 0 ? new Date(nameExpires * 1000) : null
      }
      // Returns registrar address if owned by new registrar.
      // Keep it as a separate call as this will throw exception for non existing domains
      ret.ownerOf = await Registrar.ownerOf(labelHash)
    } catch (e) {
      console.log('Error getting permanent registrar entry', e)
      return false
    } finally {
      return ret
    }
  }

  async getEntry(label) {
    let [block, legacyEntry, permEntry] = await Promise.all([
      getBlock(),
      this.getLegacyEntry(label),
      this.getPermanentEntry(label)
    ])

    let ret = {
      currentBlockDate: new Date(block.timestamp * 1000),
      registrant: 0,
      transferEndDate: null,
      isNewRegistrar: false,
      gracePeriodEndDate: null
    }

    if (permEntry) {
      ret.available = permEntry.available
      if (permEntry.nameExpires) {
        ret.expiryTime = permEntry.nameExpires
      }
      if (permEntry.ownerOf) {
        ret.registrant = permEntry.ownerOf
        ret.isNewRegistrar = true
      } else if (permEntry.nameExpires) {
        const currentTime = new Date(ret.currentBlockDate)
        const gracePeriodEndDate = new Date(
          permEntry.nameExpires.getTime() + permEntry.gracePeriod * 1000
        )
        // It is within grace period
        if (permEntry.nameExpires < currentTime < gracePeriodEndDate) {
          ret.isNewRegistrar = true
          ret.gracePeriodEndDate = gracePeriodEndDate
        }
      }
    }

    return {
      ...legacyEntry,
      ...ret
    }
  }

  async getGracePeriod(Registrar) {
    if (!this.gracePeriod) {
      this.gracePeriod = await Registrar.GRACE_PERIOD()
      return this.gracePeriod
    }
    return this.gracePeriod
  }

  async transferOwner(name, to, overrides = {}) {
    try {
      const nameArray = name.split('.')
      const labelHash = labelhash(nameArray[0])
      const account = await getAccount()
      const permanentRegistrar = this.permanentRegistrar
      const signer = await getSigner()
      const Registrar = permanentRegistrar.connect(signer)
      const networkId = await getNetworkId()
      if (parseInt(networkId) > 1000) {
        /* if private network */
        const gas = await Registrar.estimate.safeTransferFrom(
          account,
          to,
          labelHash
        )

        overrides = {
          ...overrides,
          gasLimit: gas.toNumber() * 2
        }
      }
      return Registrar.safeTransferFrom(account, to, labelHash, overrides)
    } catch (e) {
      console.log('Error calling transferOwner', e)
    }
  }

  async reclaim(name, address, overrides = {}) {
    try {
      const nameArray = name.split('.')
      const labelHash = labelhash(nameArray[0])
      const permanentRegistrar = this.permanentRegistrar
      const signer = await getSigner()
      const Registrar = permanentRegistrar.connect(signer)
      const networkId = await getNetworkId()
      if (parseInt(networkId) > 1000) {
        /* if private network */
        const gas = await Registrar.estimate.reclaim(labelHash, address)

        overrides = {
          ...overrides,
          gasLimit: gas.toNumber() * 2
        }
      }

      return Registrar.reclaim(labelHash, address, {
        ...overrides
      })
    } catch (e) {
      console.log('Error calling reclaim', e)
    }
  }

  async getRentPrice(name, duration) {
    const permanentRegistrarController = this.permanentRegistrarController
    return permanentRegistrarController.rentPrice(name, duration)
  }

  async getRentPrices(labels, duration) {
    const pricesArray = await Promise.all(
      labels.map(label => {
        return this.getRentPrice(label, duration)
      })
    )
    return pricesArray.reduce((a, c) => a.add(c))
  }

  async getMinimumCommitmentAge() {
    const permanentRegistrarController = this.permanentRegistrarController
    return permanentRegistrarController.minCommitmentAge()
  }

  async getMaximumCommitmentAge(){
    const permanentRegistrarController = this.permanentRegistrarController
    return  permanentRegistrarController.maxCommitmentAge()
  }

  async makeCommitment(name, owner, secret = '') {
    const permanentRegistrarControllerWithoutSigner = this
      .permanentRegistrarController
    const signer = await getSigner()
    const permanentRegistrarController = permanentRegistrarControllerWithoutSigner.connect(
      signer
    )
    const account = await getAccount()
    const resolverAddr = await this.getAddress('resolver.eth')
    if (parseInt(resolverAddr, 16) === 0) {
      return permanentRegistrarController.makeCommitment(name, owner, secret)
    } else {
      return permanentRegistrarController.makeCommitmentWithConfig(
        name,
        owner,
        secret,
        resolverAddr,
        account
      )
    }
  }

  async checkCommitment(label, secret = '') {
    const permanentRegistrarControllerWithoutSigner = this
      .permanentRegistrarController
    const signer = await getSigner()
    const permanentRegistrarController = permanentRegistrarControllerWithoutSigner.connect(
      signer
    )
    const account = await getAccount()
    const commitment = await this.makeCommitment(label, account, secret)
    return await permanentRegistrarController.commitments(commitment)
  }

  async commit(label, secret = '') {
    const permanentRegistrarControllerWithoutSigner = this
      .permanentRegistrarController
    const signer = await getSigner()
    const permanentRegistrarController = permanentRegistrarControllerWithoutSigner.connect(
      signer
    )
    const account = await getAccount()
    const commitment = await this.makeCommitment(label, account, secret)

    return permanentRegistrarController.commit(commitment)
  }

  async register(label, duration, secret) {
    const permanentRegistrarControllerWithoutSigner = this
      .permanentRegistrarController
    const signer = await getSigner()
    const permanentRegistrarController = permanentRegistrarControllerWithoutSigner.connect(
      signer
    )
    const account = await getAccount()
    const price = await this.getRentPrice(label, duration)
    // Add 5% markup to handle price fructuation.
    // Any unused value will be sent back by the smart contract.
    const priceWithMarkup = price.mul(105).div(100)
    const resolverAddr = await this.getAddress('resolver.eth')
    if (parseInt(resolverAddr, 16) === 0) {
      return permanentRegistrarController.register(
        label,
        account,
        duration,
        secret,
        { value: priceWithMarkup }
      )
    } else {
      return permanentRegistrarController.registerWithConfig(
        label,
        account,
        duration,
        secret,
        resolverAddr,
        account,
        { value: priceWithMarkup }
      )
    }
  }

  async renew(label, duration) {
    const permanentRegistrarControllerWithoutSigner = this
      .permanentRegistrarController
    const signer = await getSigner()
    const permanentRegistrarController = permanentRegistrarControllerWithoutSigner.connect(
      signer
    )
    const price = await this.getRentPrice(label, duration)

    return permanentRegistrarController.renew(label, duration, { value: price })
  }

  async renewAll(labels, duration) {
    const bulkRenewalWithoutSigner = this
      .bulkRenewal
    const signer = await getSigner()
    const bulkRenewal = bulkRenewalWithoutSigner.connect(
      signer
    )
    const prices = await this.getRentPrices(labels, duration)
    return bulkRenewal.renewAll(
      labels,
      duration,
      { value: prices }
    )
  }

  async releaseDeed(label) {
    const legacyAuctionRegistrar = this.legacyAuctionRegistrar
    const signer = await getSigner()
    const legacyAuctionRegistrarWithSigner = legacyAuctionRegistrar.connect(
      signer
    )
    const hash = labelhash(label)
    return legacyAuctionRegistrarWithSigner.releaseDeed(hash)
  }

  async isDNSRegistrar(parentOwner) {
    const provider = await getProvider()
    const registrar = await getDnsRegistrarContract({ parentOwner, provider })
    let isDNSSECSupported = false
    try {
      isDNSSECSupported = await registrar['supportsInterface(bytes4)'](dnsRegistrarInterfaceId)
    } catch (e) {
      console.log({e})
    }
    return isDNSSECSupported
  }

  async getDNSEntry(name, parentOwner, owner) {
    // Do not cache as it needs to be refetched on "Refresh"
    const dnsRegistrar = {}
    const web3 = await getWeb3Read()

    // This will probably only work if accessed via Metamask which holds its own web3.js provider.
    // It needs refactoring to support local environment provided via ethers.js provider, potentially porting dnsprovejs from web3.js to ethers.js
    const provider = web3._web3Provider
    const registrarjs = new DNSRegistrarJS(provider, parentOwner)
    try {
      const claim = await registrarjs.claim(name)
      const result = claim.getResult()
      dnsRegistrar.claim = claim
      dnsRegistrar.result = result
      if (result.found) {
        const proofs = result.proofs
        dnsRegistrar.dnsOwner = claim.getOwner()
        if (!dnsRegistrar.dnsOwner) {
          // DNS Record is invalid
          dnsRegistrar.state = 4
        } else {
          // Valid reacord is found
          if (
            !owner ||
            dnsRegistrar.dnsOwner.toLowerCase() === owner.toLowerCase()
          ) {
            dnsRegistrar.state = 5
            // Out of sync
          } else {
            dnsRegistrar.state = 6
          }
        }
      } else {
        if (result.nsec) {
          if (result.results.length === 4) {
            // DNS entry does not exist
            dnsRegistrar.state = 1
          } else if (result.results.length === 6) {
            // DNS entry exists but _ens subdomain does not exist
            dnsRegistrar.state = 3
          } else {
            throw `DNSSEC results cannot be ${result.results.length}`
          }
        } else {
          // DNSSEC is not enabled
          dnsRegistrar.state = 2
        }
      }
    } catch (e) {
      console.log('Problem fetching data from DNS', e)
      // Problem fetching data from DNS
      dnsRegistrar.state = 0
    }
    return dnsRegistrar
  }

  async submitProof(name, parentOwner) {
    const provider = await getProvider()
    const { claim, result } = await this.getDNSEntry(name, parentOwner)
    const registrarWithoutSigner = await getDnsRegistrarContract({
      parentOwner,
      provider
    })
    const signer = await getSigner()
    const registrar = registrarWithoutSigner.connect(signer)
    const data = await claim.oracle.getAllProofs(result, {})
    const allProven = await claim.oracle.allProven(result)
    if (allProven) {
      return registrar.claim(claim.encodedName, data[1])
    } else {
      return registrar.proveAndClaim(claim.encodedName, data[0], data[1])
    }
  }

  async registerTestdomain(label) {
    const provider = await getProvider()
    const testAddress = await this.ENS.owner(namehash('test'))
    const registrarWithoutSigner = getTestRegistrarContract({
      address: testAddress,
      provider
    })
    const signer = await getSigner()
    const hash = labelhash(label)
    const account = await getAccount()
    const registrar = registrarWithoutSigner.connect(signer)
    return registrar.register(hash, account)
  }

  async expiryTimes(label) {
    const provider = await getProvider()
    const testAddress = await this.ENS.owner(namehash('test'))
    const TestRegistrar = await getTestRegistrarContract({
      address: testAddress,
      provider
    })
    const hash = labelhash(label)
    const result = await TestRegistrar.expiryTimes(hash)
    if (result > 0) {
      return new Date(result * 1000)
    }
  }
}

async function getEthResolver(ENS) {
  const resolverAddr = await ENS.resolver(namehash('eth'))
  const provider = await getProvider()
  return getResolverContract({ address: resolverAddr, provider })
}

export async function setupRegistrar(registryAddress) {
  const provider = await getProvider()
  const ENS = getENSContract({ address: registryAddress, provider })
  const Resolver = await getEthResolver(ENS)

  let ethAddress = await ENS.owner(namehash('eth'))

  let controllerAddress = await Resolver.interfaceImplementer(
    namehash('eth'),
    permanentRegistrarInterfaceId
  )
  let legacyAuctionRegistrarAddress = await Resolver.interfaceImplementer(
    namehash('eth'),
    legacyRegistrarInterfaceId
  )

  let bulkRenewalAddress = await Resolver.interfaceImplementer(
    namehash('eth'),
    bulkRenewalInterfaceId
  )

  return new Registrar({
    registryAddress,
    legacyAuctionRegistrarAddress,
    ethAddress,
    controllerAddress,
    bulkRenewalAddress,
    provider
  })
}
