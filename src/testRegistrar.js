import { labelhash } from './utils/labelhash'
import { getProvider } from './web3'

export async function registerTestdomain(label) {
  const provider = await getProvider()
  const registrarWithoutSigner = getTestRegistrarContract({ address: , provider})
  const signer = await getSigner()
  const hash = labelhash(label)
  const account = await getAccount()
  const registrar = registrarWithoutSigner.connect(signer)
  return registrar.register(hash, account)
}
// not added to ens2

export async function expiryTimes(label, owner) {
  const provider = await getProvider()
  const { registrar } = await getTestRegistrarContract({ address: })
  const hash = labelhash(label)
  const result = await registrar.expiryTimes(hash)
  if (result > 0) {
    return new Date(result * 1000)
  }
}
