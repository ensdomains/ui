import { getENS, getNamehash, getResolverContract } from './ens'
import { getWeb3, getAccount, getBlock, getSigner } from './web3'
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

export const getLegacyAuctionRegistrar = async () => {
  if (ethRegistrar) {
    return {
      ethRegistrar
    }
  }
  try {
    const { Resolver } = await getEthResolver()
    const signer = await getSigner()
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
    const signer = await getSigner()
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
    const signer = await getSigner()
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

const getEthResolver = async () => {
  const { ENS } = await getENS()
  const resolverAddr = await ENS.resolver(getNamehash('eth'))
  return getResolverContract(resolverAddr)
}

export const getLegacyEntry = async name => {
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

export const getPermanentEntry = async label => {
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
    obj.transferPeriodEnds = await Registrar.transferPeriodEnds()
    // Returns registrar address if owned by new registrar
    obj.ownerOf = await Registrar.ownerOf(labelHash)
    const nameExpires = await Registrar.nameExpires(labelHash)
    if (nameExpires > 0) {
      obj.nameExpires = new Date(nameExpires * 1000)
    }
  } catch (e) {
    console.log('Error getting permanent registrar entry', e)
    obj.error = e.message
  } finally {
    return obj
  }
}

export const getDeed = async address => {
  const signer = await getSigner()
  return new Contract(address, deedContract, signer)
}

export const getEntry = async name => {
  let legacyEntry = await getLegacyEntry(name)
  let block = await getBlock()
  let ret = {
    currentBlockDate: new Date(block.timestamp * 1000),
    registrant: 0,
    transferEndDate: null,
    isNewRegistrar: false
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
    if (permEntry.ownerOf) {
      ret.isNewRegistrar = true
      ret.registrant = permEntry.ownerOf
    }
    if (permEntry.nameExpires) {
      ret.expiryTime = permEntry.nameExpires
    }
  } catch (e) {
    console.log('error getting permanent registry', e)
  }
  return {
    ...legacyEntry,
    ...ret
  }
}

export const transferOwner = async ({ to, name }) => {
  try {
    const nameArray = name.split('.')
    const labelHash = labelhash(nameArray[0])
    const account = await getAccount()
    const { permanentRegistrar: Registrar } = await getPermanentRegistrar()
    return Registrar.safeTransferFrom(account, to, labelHash)
  } catch (e) {
    console.log('error getting permanentRegistrar contract', e)
  }
}

export const reclaim = async ({ name, address }) => {
  try {
    const nameArray = name.split('.')
    const labelHash = labelhash(nameArray[0])
    const { permanentRegistrar: Registrar } = await getPermanentRegistrar()
    return Registrar.reclaim(labelHash, address)
  } catch (e) {
    console.log('error getting permanentRegistrar contract', e)
  }
}

export const getRentPrice = async (name, duration) => {
  const {
    permanentRegistrarController
  } = await getPermanentRegistrarController()

  const price = await permanentRegistrarController.rentPrice(name, duration)
  return price
}

export const getMinimumCommitmentAge = async () => {
  const {
    permanentRegistrarController
  } = await getPermanentRegistrarController()
  return permanentRegistrarController.minCommitmentAge()
}

export const makeCommitment = async (name, owner, secret = '') => {
  const {
    permanentRegistrarController
  } = await getPermanentRegistrarController()

  const commitment = await permanentRegistrarController.makeCommitment(
    name,
    owner,
    secret
  )

  return commitment
}

export const commit = async (label, secret = '') => {
  const {
    permanentRegistrarController
  } = await getPermanentRegistrarController()
  const account = await getAccount()

  const commitment = await makeCommitment(label, account, secret)

  return permanentRegistrarController.commit(commitment)
}

export const register = async (label, duration, secret) => {
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

export const renew = async (label, duration) => {
  const {
    permanentRegistrarController
  } = await getPermanentRegistrarController()
  const price = await getRentPrice(label, duration)

  return permanentRegistrarController.renew(label, duration, { value: price })
}

export const startAuctionsAndBid = async (
  hashes,
  sealedBid,
  decoyBidAmount
) => {
  const Registrar = await getLegacyAuctionRegistrar()
  const web3 = await getWeb3()

  return Registrar.startAuctionsAndBid(hashes, sealedBid(), {
    value: web3.utils.toWei(decoyBidAmount, 'ether')
  })
}

export const transferRegistrars = async label => {
  const { ethRegistrar } = await getLegacyAuctionRegistrar()
  const hash = labelhash(label)
  return ethRegistrar.transferRegistrars(hash)
}

export const releaseDeed = async label => {
  const { ethRegistrar } = await getLegacyAuctionRegistrar()
  const hash = labelhash(label)
  return ethRegistrar.releaseDeed(hash)
}
