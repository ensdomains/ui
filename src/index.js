import { getProvider, setupWeb3, getNetworkId } from './web3'
import { ENS } from './ens.js'
import { setupRegistrar } from './registrar'
export { utils } from 'ethers'

export async function setupENS({
  customProvider,
  ensAddress,
  reloadOnAccountsChange
} = {}) {
  const { provider } = await setupWeb3({
    customProvider,
    reloadOnAccountsChange
  })
  const networkId = await getNetworkId()
  const ens = new ENS({ provider, networkId, registryAddress: ensAddress })
  const registrar = await setupRegistrar(ens.registryAddress)
  return { ens, registrar }
}

export * from './ens'
export * from './registrar'
export * from './web3'
export * from './constants/interfaces'
export * from './constants/tlds'
export * from './utils'
export * from './contracts'
