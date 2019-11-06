import { setupWeb3, clearWeb3Cache } from './web3'
import { getENS, clearENSCache } from './ens'
import { clearRegistrarCache } from './registrar'

export async function setupENS({
  customProvider,
  ensAddress,
  reloadOnAccountsChange
} = {}) {
  await setupWeb3({ customProvider, reloadOnAccountsChange })
  await getENS(ensAddress)
}

export function clearCache() {
  clearWeb3Cache()
  clearENSCache()
  clearRegistrarCache()
}

export * from './ens'
export * from './registrar'
export * from './registry'
export * from './web3'
export * from './constants/interfaces'
export * from './constants/tlds'
export * from './utils'
