import { getProvider, setupWeb3, getNetworkId } from './web3'
import ENS from './ens'

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
  const ens = new ENS({ provider, networkId, ensAddress })
  return { ens }
}

export * from './ensOld'
export * from './registrar'
export * from './registry'
export * from './web3'
export * from './constants/interfaces'
export * from './constants/tlds'
export * from './utils'
