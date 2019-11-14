import {
  getENS,
  getNamehash,
  getResolverContract,
  getDnsRegistrarContract
} from './ens'
import {
  getWeb3Read,
  getAccount,
  getBlock,
  getProvider,
  getSigner,
  getNetworkId
} from './web3'
import { Contract } from 'ethers'
import { abi as legacyAuctionRegistrarContract } from '@ensdomains/ens/build/contracts/HashRegistrar'
import { abi as deedContract } from '@ensdomains/ens/build/contracts/Deed'
import { abi as permanentRegistrarContract } from '@ensdomains/ethregistrar/build/contracts/BaseRegistrarImplementation'
import { abi as permanentRegistrarControllerContract } from '@ensdomains/ethregistrar/build/contracts/ETHRegistrarController'
import { interfaces } from './constants/interfaces'
import { isEncodedLabelhash, labelhash } from './utils/labelhash'
import DNSRegistrarJS from '@ensdomains/dnsregistrar'
const {
  legacyRegistrar: legacyRegistrarInterfaceId,
  permanentRegistrar: permanentRegistrarInterfaceId
} = interfaces

let ethRegistrar
let dnsRegistrar
let permanentRegistrar
let permanentRegistrarController
let migrationLockPeriod
let gracePeriod

const getEthResolver = async () => {
  const ENS = await getENS()
  const resolverAddr = await ENS.resolver(getNamehash('eth'))
  return getResolverContract(resolverAddr)
}

const getDeed = async address => {
  const provider = await getProvider()
  return new Contract(address, deedContract, signer)
}

export const getLegacyAuctionRegistrar = async () => {
  if (ethRegistrar) {
    return {
      ethRegistrar
    }
  }
  try {
    const Resolver = await getEthResolver()
    const provider = await getProvider()
    let legacyAuctionRegistrarAddress = await Resolver.interfaceImplementer(
      getNamehash('eth'),
      legacyRegistrarInterfaceId
    )

    ethRegistrar = new Contract(
      legacyAuctionRegistrarAddress,
      legacyAuctionRegistrarContract,
      provider
    )

    return {
      ethRegistrar
    }
  } catch (e) {}
}

export const getPermanentRegistrar = async () => {
  if (permanentRegistrar) {
    return {
      permanentRegistrar
    }
  }

  try {
    const ENS = await getENS()
    const provider = await getProvider()
    const ethAddr = await ENS.owner(getNamehash('eth'))
    permanentRegistrar = new Contract(
      ethAddr,
      permanentRegistrarContract,
      provider
    )
    return {
      permanentRegistrar
    }
  } catch (e) {}
}

export const getPermanentRegistrarController = async () => {
  if (permanentRegistrarController) {
    return {
      permanentRegistrarController
    }
  }

  try {
    const Resolver = await getEthResolver()
    const provider = await getProvider()
    let controllerAddress = await Resolver.interfaceImplementer(
      getNamehash('eth'),
      permanentRegistrarInterfaceId
    )
    permanentRegistrarController = new Contract(
      controllerAddress,
      permanentRegistrarControllerContract,
      provider
    )
    return {
      permanentRegistrarController
    }
  } catch (e) {
    console.log('error getting permanent registrar controller', e)
  }
}

const getLegacyEntry = async (Registrar, name) => {
  let obj
  try {
    const { ethRegistrar: Registrar } = await getLegacyAuctionRegistrar()
    let deedOwner = '0x0'
    const entry = await Registrar.entries(labelhash(name))
    if (parseInt(entry[1], 16) !== 0) {
      const deed = await getDeed(entry[1])
      deedOwner = await deed.owner()
    }
    obj = {
      deedOwner,
      state: parseInt(entry[0]),
      registrationDate: parseInt(entry[2]) * 1000,
      revealDate: (parseInt(entry[2]) - 24 * 2 * 60 * 60) * 1000,
      value: parseInt(entry[3]),
      highestBid: parseInt(entry[4])
    }
  } catch (e) {
    obj = {
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
  return obj
}

// Caching because they are constant

async function getMigrationLockPeriod(Registrar) {
  if (!migrationLockPeriod) {
    return Registrar.MIGRATION_LOCK_PERIOD()
  }
  return migrationLockPeriod
}

async function getGracePeriod(Registrar) {
  if (!gracePeriod) {
    return Registrar.GRACE_PERIOD()
  }
  return gracePeriod
}

async function getOwnerOf(Registrar, labelHash) {
  try {
    return Registrar.ownerOf(labelHash)
  } catch {
    return '0x0'
  }
}

const getPermanentEntry = async (Registrar, RegistrarController, label) => {
  let getAvailable
  let obj = {
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

    const [
      available,
      transferPeriodEnds,
      nameExpires,
      gracePeriod,
      migrationLockPeriod
    ] = await Promise.all([
      getAvailable,
      Registrar.transferPeriodEnds(),
      Registrar.nameExpires(labelHash),
      getGracePeriod(Registrar),
      getMigrationLockPeriod(Registrar)
    ])

    obj = {
      ...obj,
      migrationLockPeriod: parseInt(migrationLockPeriod),
      available,
      gracePeriod,
      transferPeriodEnds,
      nameExpires: nameExpires > 0 ? new Date(nameExpires * 1000) : null
    }
    // Returns registrar address if owned by new registrar.
    // Keep it as a separate call as this will throw exception for non existing domains
    obj.ownerOf = await Registrar.ownerOf(labelHash)
  } catch (e) {
    console.log('Error getting permanent registrar entry', e)
    return false
  } finally {
    return obj
  }
}

const isDNSRegistrar = async name => {
  // Keep it until new registrar contract with supportsInterface function is deployed into mainnet
  return name === 'xyz'
  // const { registrar } = await getDnsRegistrarContract(name)
  // let isDNSSECSupported = false
  // try {
  //   isDNSSECSupported = await registrar
  //     .supportsInterface(dnsRegistrarInterfaceId)
  // } catch (e) {
  //   console.log({e})
  // }
  // return isDNSSECSupported
}

const getDNSEntry = async (name, parentOwner, owner) => {
  // Do not cache as it needs to be refetched on "Refresh"
  dnsRegistrar = {}
  const web3 = await getWeb3Read()
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

const getEntry = async name => {
  const [
    { ethRegistrar: AuctionRegistrar },
    { permanentRegistrar: Registrar },
    { permanentRegistrarController: RegistrarController }
  ] = await Promise.all([
    getLegacyAuctionRegistrar(),
    getPermanentRegistrar(),
    getPermanentRegistrarController()
  ])
  let [block, legacyEntry, permEntry] = await Promise.all([
    getBlock(),
    getLegacyEntry(AuctionRegistrar, name),
    getPermanentEntry(Registrar, RegistrarController, name)
  ])

  let ret = {
    currentBlockDate: new Date(block.timestamp * 1000),
    registrant: 0,
    transferEndDate: null,
    isNewRegistrar: false,
    gracePeriodEndDate: null
  }

  if (permEntry) {
    if (legacyEntry.registrationDate && permEntry.migrationLockPeriod) {
      ret.migrationStartDate = new Date(
        legacyEntry.registrationDate + permEntry.migrationLockPeriod * 1000
      )
    } else {
      ret.migrationStartDate = null
    }

    if (permEntry.transferPeriodEnds) {
      ret.transferEndDate = new Date(permEntry.transferPeriodEnds * 1000)
    }
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
        currentTime.getTime() + permEntry.gracePeriod * 1000
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

const transferOwner = async (name, to, overrides = {}) => {
  try {
    const nameArray = name.split('.')
    const labelHash = labelhash(nameArray[0])
    const account = await getAccount()
    const { permanentRegistrar } = await getPermanentRegistrar()
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

const reclaim = async (name, address, overrides = {}) => {
  try {
    const nameArray = name.split('.')
    const labelHash = labelhash(nameArray[0])
    const { permanentRegistrar } = await getPermanentRegistrar()
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

const getRentPrice = async (name, duration) => {
  const {
    permanentRegistrarController
  } = await getPermanentRegistrarController()
  return permanentRegistrarController.rentPrice(name, duration)
}

const getMinimumCommitmentAge = async () => {
  const {
    permanentRegistrarController
  } = await getPermanentRegistrarController()
  return permanentRegistrarController.minCommitmentAge()
}

const makeCommitment = async (name, owner, secret = '') => {
  const {
    permanentRegistrarController: permanentRegistrarControllerWithoutSigner
  } = await getPermanentRegistrarController()
  const signer = await getSigner()
  const permanentRegistrarController = permanentRegistrarControllerWithoutSigner.connect(
    signer
  )
  return permanentRegistrarController.makeCommitment(name, owner, secret)
}

const commit = async (label, secret = '') => {
  const {
    permanentRegistrarController: permanentRegistrarControllerWithoutSigner
  } = await getPermanentRegistrarController()
  const signer = await getSigner()
  const permanentRegistrarController = permanentRegistrarControllerWithoutSigner.connect(
    signer
  )
  const account = await getAccount()
  const commitment = await makeCommitment(label, account, secret)

  return permanentRegistrarController.commit(commitment)
}

const register = async (label, duration, secret) => {
  const {
    permanentRegistrarController: permanentRegistrarControllerWithoutSigner
  } = await getPermanentRegistrarController()
  const signer = await getSigner()
  const permanentRegistrarController = permanentRegistrarControllerWithoutSigner.connect(
    signer
  )
  const account = await getAccount()
  const price = await getRentPrice(label, duration)

  return permanentRegistrarController.register(
    label,
    account,
    duration,
    secret,
    { value: price }
  )
}

const renew = async (label, duration) => {
  const {
    permanentRegistrarController: permanentRegistrarControllerWithoutSigner
  } = await getPermanentRegistrarController()
  const signer = await getSigner()
  const permanentRegistrarController = permanentRegistrarControllerWithoutSigner.connect(
    signer
  )
  const price = await getRentPrice(label, duration)

  return permanentRegistrarController.renew(label, duration, { value: price })
}

const transferRegistrars = async label => {
  const { ethRegistrar } = await getLegacyAuctionRegistrar()
  const signer = await getSigner()
  const ethRegistrarWithSigner = ethRegistrar.connect(signer)
  const hash = labelhash(label)
  return ethRegistrarWithSigner.transferRegistrars(hash)
}

const releaseDeed = async label => {
  const { ethRegistrar } = await getLegacyAuctionRegistrar()
  const signer = await getSigner()
  const ethRegistrarWithSigner = ethRegistrar.connect(signer)
  const hash = labelhash(label)
  return ethRegistrarWithSigner.releaseDeed(hash)
}

const submitProof = async (name, parentOwner) => {
  const { claim, result } = await getDNSEntry(name, parentOwner)
  const { registrar: registrarWithoutSigner } = await getDnsRegistrarContract(
    parentOwner
  )
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

export {
  getEntry,
  getDNSEntry,
  isDNSRegistrar,
  transferOwner,
  reclaim,
  getRentPrice,
  getMinimumCommitmentAge,
  makeCommitment,
  commit,
  register,
  renew,
  transferRegistrars,
  releaseDeed,
  submitProof
}
