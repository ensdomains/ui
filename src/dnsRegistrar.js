import DNSRegistrarJS from '@ensdomains/dnsregistrar'
import { getDnsRegistrarContract } from './contracts'
import { getWeb3Read } from './web3'

export const isDNSRegistrar = async name => {
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

export const getDNSEntry = async (name, parentOwner, owner) => {
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
