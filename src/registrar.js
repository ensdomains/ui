import { getENS, getNamehash, getResolverContract } from './ens'
import { getAccount, getBlock, getSignerOrProvider, getNetworkId } from './web3'
import { Contract } from 'ethers'
import { abi as legacyAuctionRegistrarContract } from '@ensdomains/ens/build/contracts/HashRegistrar'
import { abi as deedContract } from '@ensdomains/ens/build/contracts/Deed'
import { abi as permanentRegistrarContract } from '@ensdomains/ethregistrar/build/contracts/BaseRegistrarImplementation'
import { abi as permanentRegistrarControllerContract } from '@ensdomains/ethregistrar/build/contracts/ETHRegistrarController'
import { interfaces } from './constants/interfaces'
import { isEncodedLabelhash, labelhash } from './utils/labelhash'

const {
  legacyRegistrar: legacyRegistrarInterfaceId,
  permanentRegistrar: permanentRegistrarInterfaceId
} = interfaces

let ethRegistrar
let permanentRegistrar
let permanentRegistrarController

const getEthResolver = async () => {
  const { ENS } = await getENS()
  const resolverAddr = await ENS.resolver(getNamehash('eth'))
  return getResolverContract(resolverAddr)
}

const getDeed = async address => {
  const signer = await getSignerOrProvider()
  return new Contract(address, deedContract, signer)
}

export const getLegacyAuctionRegistrar = async () => {
  if (ethRegistrar) {
    return {
      ethRegistrar
    }
  }
  try {
    const { Resolver } = await getEthResolver()
    const signer = await getSignerOrProvider()
    let legacyAuctionRegistrarAddress = await Resolver.interfaceImplementer(
      getNamehash('eth'),
      legacyRegistrarInterfaceId
    )

    ethRegistrar = new Contract(
      legacyAuctionRegistrarAddress,
      legacyAuctionRegistrarContract,
      signer
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
    const { ENS } = await getENS()
    const signer = await getSignerOrProvider()
    const ethAddr = await ENS.owner(getNamehash('eth'))
    permanentRegistrar = new Contract(
      ethAddr,
      permanentRegistrarContract,
      signer
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
    const { Resolver } = await getEthResolver()
    const signer = await getSignerOrProvider()
    let controllerAddress = await Resolver.interfaceImplementer(
      getNamehash('eth'),
      permanentRegistrarInterfaceId
    )
    permanentRegistrarController = new Contract(
      controllerAddress,
      permanentRegistrarControllerContract,
      signer
    )
    return {
      permanentRegistrarController
    }
  } catch (e) {
    console.log('error getting permanent registrar controller', e)
  }
}

const getLegacyEntry = async name => {
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

const getPermanentEntry = async label => {
  let obj = {
    available: null,
    nameExpires: null
  }
  try {
    const labelHash = labelhash(label)
    const { permanentRegistrar: Registrar } = await getPermanentRegistrar()
    const {
      permanentRegistrarController: RegistrarController
    } = await getPermanentRegistrarController()
    // Returns true if name is available
    if (isEncodedLabelhash(label)) {
      obj.available = await Registrar.available(labelHash)
    } else {
      obj.available = await RegistrarController.available(label)
    }
    // This is used for old registrar to figure out when the name can be migrated.
    obj.migrationLockPeriod = parseInt(await Registrar.MIGRATION_LOCK_PERIOD())
    obj.gracePeriod = await Registrar.GRACE_PERIOD()
    obj.transferPeriodEnds = await Registrar.transferPeriodEnds()
    const nameExpires = await Registrar.nameExpires(labelHash)
    if (nameExpires > 0) {
      obj.nameExpires = new Date(nameExpires * 1000)
    }
    // Returns registrar address if owned by new registrar
    obj.ownerOf = await Registrar.ownerOf(labelHash)
  } catch (e) {
    console.log('Error getting permanent registrar entry', e)
    obj.error = e.message
  } finally {
    return obj
  }
}

const getEntry = async name => {
  let legacyEntry = await getLegacyEntry(name)
  let block = await getBlock()
  let ret = {
    currentBlockDate: new Date(block.timestamp * 1000),
    registrant: 0,
    transferEndDate: null,
    isNewRegistrar: false,
    gracePeriodEndDate: null
  }

  try {
    let permEntry = await getPermanentEntry(name)
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
    if (!permEntry.available) {
      // Owned
      ret.state = 2
    }
    if (permEntry.nameExpires) {
      ret.expiryTime = permEntry.nameExpires
    }
    if (permEntry.ownerOf) {
      ret.registrant = permEntry.ownerOf
      ret.isNewRegistrar = true
    }else if (permEntry.nameExpires){
      const currentTime = new Date(ret.currentBlockDate)
      const gracePeriodEndDate = new Date(currentTime.getTime() +  (permEntry.gracePeriod * 1000))
      // It is within grace period
      if (permEntry.nameExpires < currentTime < gracePeriodEndDate){
        ret.isNewRegistrar = true
        ret.gracePeriodEndDate = gracePeriodEndDate
      }
    }
  } catch (e) {
    console.log('error getting permanent registry', e)
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
    const { permanentRegistrar: Registrar } = await getPermanentRegistrar()

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
    const { permanentRegistrar: Registrar } = await getPermanentRegistrar()
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
    permanentRegistrarController
  } = await getPermanentRegistrarController()

  return permanentRegistrarController.makeCommitment(name, owner, secret)
}

const commit = async (label, secret = '') => {
  const {
    permanentRegistrarController
  } = await getPermanentRegistrarController()
  const account = await getAccount()
  const commitment = await makeCommitment(label, account, secret)

  return permanentRegistrarController.commit(commitment)
}

const register = async (label, duration, secret) => {
  const {
    permanentRegistrarController
  } = await getPermanentRegistrarController()
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
    permanentRegistrarController
  } = await getPermanentRegistrarController()
  const price = await getRentPrice(label, duration)

  return permanentRegistrarController.renew(label, duration, { value: price })
}

const transferRegistrars = async label => {
  const { ethRegistrar } = await getLegacyAuctionRegistrar()
  const hash = labelhash(label)
  return ethRegistrar.transferRegistrars(hash)
}

const releaseDeed = async label => {
  const { ethRegistrar } = await getLegacyAuctionRegistrar()
  const hash = labelhash(label)
  return ethRegistrar.releaseDeed(hash)
}

export {
  getEntry,
  transferOwner,
  reclaim,
  getRentPrice,
  getMinimumCommitmentAge,
  makeCommitment,
  commit,
  register,
  renew,
  transferRegistrars,
  releaseDeed
}
