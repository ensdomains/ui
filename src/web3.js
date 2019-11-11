import { ethers } from 'ethers'
import { IFrameEthereumProvider } from '@ethvault/iframe-provider'

let provider
let signer
let readOnly = false
let requested = false

export async function setupWeb3({
  customProvider,
  reloadOnAccountsChange = false
}) {
  if (provider) {
    return { provider, signer }
  }
  if (customProvider) {
    if (typeof customProvider === 'string') {
      // handle raw RPC endpoint URL
      provider = new ethers.providers.JsonRpcProvider(customProvider)
      signer = provider.getSigner()
    } else {
      // handle EIP 1193 provider
      provider = new ethers.providers.Web3Provider(customProvider)
    }
    return { provider, signer }
  }

  // If the window is in an iframe, return the iframe provider IFF the iframe provider can be enabled
  if (window && window.parent && window.self && window.self !== window.parent) {
    try {
      const iframeProvider = new IFrameEthereumProvider({
        targetOrigin: 'https://myethvault.com'
      })

      await Promise.race([
        iframeProvider.enable(),
        // Race the enable with a promise that rejects after 1 second
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timed out after 1 second')), 1000)
        )
      ])

      window.web3 = iframeProvider
      window.ethereum = iframeProvider
    } catch (error) {
      console.error('Failed to create and enable iframe provider', error)
    }
  }

  if (window && window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum)
    signer = provider.getSigner()
    if (window.ethereum.on && reloadOnAccountsChange) {
      window.ethereum.on('accountsChanged', function() {
        window.location.reload()
      })
    }
    return { provider, signer }
  } else if (window.web3 && window.web3.currentProvider) {
    provider = new ethers.providers.Web3Provider(window.web3.currentProvider)
    const id = (await provider.getNetwork()).chainId
    signer = provider.getSigner()
    return { provider, signer }
  } else {
    try {
      const url = 'http://localhost:8545'
      await fetch(url)
      console.log('local node active')
      provider = new ethers.providers.JsonRpcProvider(url)
    } catch (error) {
      if (
        error.readyState === 4 &&
        (error.status === 400 || error.status === 200)
      ) {
        // the endpoint is active
        console.log('Success')
      } else {
        console.log(
          'No web3 instance injected. Falling back to cloud provider.'
        )
        readOnly = true
        provider = new ethers.getDefaultProvider('homestead')
        return { provider, signer }
      }
    }
  }
}

export async function getWeb3() {
  if (!provider) {
    throw new Error(
      'Ethers has not been instantiated, please call setupWeb3() first'
    )
  }
  return provider
}

export async function getWeb3Read() {
  if (!provider) {
    throw new Error(
      'Ethers has not been instantiated, please call setupWeb3() first'
    )
  }
  return provider
}

export function isReadOnly() {
  return readOnly
}

function getNetworkProviderUrl(id) {
  switch (id) {
    case '1':
      return `https://mainnet.infura.io/v3/90f210707d3c450f847659dc9a3436ea`
    case '3':
      return `https://ropsten.infura.io/v3/90f210707d3c450f847659dc9a3436ea`
    case '4':
      return `https://rinkeby.infura.io/v3/90f210707d3c450f847659dc9a3436ea`
    case '5':
      return `https://goerli.infura.io/v3/90f210707d3c450f847659dc9a3436ea`
    default:
      return 'private'
  }
}

export async function getProvider() {
  return getWeb3()
}

export async function getSigner() {
  const provider = await getWeb3()
  try {
    const signer = provider.getSigner()
    await signer.getAddress()
    return signer
  } catch (e) {
    if (window.ethereum) {
      try {
        if (requested === true) return provider
        await window.ethereum.enable()
        const signer = await provider.getSigner()
        await signer.getAddress()
        return signer
      } catch (e) {
        console.log(e)
        requested = true
        return provider
      }
    } else {
      return provider
    }
  }
}

export async function getAccount() {
  const provider = await getWeb3()
  try {
    const signer = await provider.getSigner()
    return signer.getAddress()
  } catch (e) {
    throw e
  }
}

export async function getAccounts() {
  try {
    const accounts = [await signer.getAddress()]

    if (accounts.length > 0) {
      return accounts
    } else if (window.ethereum) {
      try {
        const accounts = await window.ethereum.enable()
        return accounts
      } catch (error) {
        console.warn('Did not allow app to access dapp browser')
        throw error
      }
    } else {
      return []
    }
  } catch (_) {
    return []
  }
}

export async function getNetworkId() {
  const provider = await getWeb3()
  const network = await provider.getNetwork()
  return network.chainId
}

export async function getBlock() {
  try {
    const provider = await getWeb3()
    const block = await provider.getBlockNumber()
    const blockDetails = await provider.getBlock(block)
    return {
      number: blockDetails.number,
      timestamp: blockDetails.timestamp
    }
  } catch (e) {
    console.log('error getting block details', e)
    return {
      number: 0,
      timestamp: 0
    }
  }
}
