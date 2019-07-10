import { setupWeb3 } from './web3'
import { getENS } from './ens'

export async function setupENS({
  customProvider,
  ensAddress,
  reloadOnAccountsChange
} = {}) {
  await setupWeb3({ customProvider, reloadOnAccountsChange })
  await getENS(ensAddress)
}

export * from './ens'
export * from './registrar'
export * from './registry'
export * from './web3'
export * from './constants/interfaces'
export * from './constants/tlds'
export * from './utils'
