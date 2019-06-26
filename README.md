# Reusable functions and components for the ENS apps

Most functions in this library are async functions and therefore return promises which can be awaited or chained with `.then`.

## Setup

Setup for the library is done by calling the `setupENS` function. It can be optionally provided with a customProvider and an ENS address. Generally you won't need this unless you are running ganache.

```js
import { setupENS } from '@ensdomains/ui'

window.addEventListener('load', async () => {
  await setupENS() // will instantiate with window.web3/window.ethereum if found, read-only if not.
  // Once setup has finished you can now call functions off the library
})
```

## API

### `async function setupENS(name): void`

#### Arguments

options (object): {
customProvider (object): Provider object from web3
ensAddress (string): Address of the ENS registry
}

#### Example

```js
import { setupENS } from '@ensdomains/ui'

window.addEventListener('load', async () => {
  await setupENS()
})
```

### `async function getOwner(name): Address`

#### Arguments

name (string): An ENS name (e.g: vitalik.eth)

#### Returns

owner (address): Ethereum address of the owner on the registry

#### Example

```js
import { getOwner } from '@ensdomains/ui'
const name = 'vitalik.eth'
const owner = await getOwner('vitalik.eth')
// 0x123...
```

### `async function getResolver(name): Address`

#### Arguments

name (string): An ENS name (e.g: vitalik.eth)

#### Returns

owner (address): Ethereum address of the resolver contract

#### Example

```js
import { getResolver } from '@ensdomains/ui'
const owner = await getResolver('vitalik.eth')
// 0x123...
```

### `async function getResolverWithLabelHash(labelHash, nodeHash): Address`

#### Arguments

labelHash (string): Hash of the label e.g vitalik (vitalik.eth)
nodeHash (string): Hash of the rest of the name (minus the library) e.g eth (vitalik.eth)

#### Returns

resolver (address): Ethereum address of the resolver contract

#### Example

```js
import { getResolverWithLabelHash } from '@ensdomains/ui'
const resolver = await getResolver(labelHash, nodeHash)
// 0x123...
```

### `async function getOwnerWithLabelHash(labelHash, nodeHash): Address`

#### Arguments

labelHash (string): Hash of the label e.g vitalik (vitalik.eth)
nodeHash (string): Hash of the rest of the name (minus the library) e.g eth (vitalik.eth)

#### Returns

owner (address): Ethereum address of the resolver contract

#### Example

```js
import { getOwnerWithLabelHash } from '@ensdomains/ui'
const owner = await getOwnerWithLabelHash(labelHash, nodeHash)
// 0x123...
```

### `async function getAddr(name): Address`

#### Arguments

name (string): An ENS name (e.g: vitalik.eth)

#### Returns

address (address): An Ethereum address that was set on the resolver

#### Example

```js
import { getAddr } from '@ensdomains/ui'
const addr = await getAddr('vitalik.eth')
// 0x123...
```

### `async function getContent(name): Contenthash`

#### Arguments

name (string): An ENS name (e.g: vitalik.eth)

#### Returns

contentHash (string): A content hash string for IPFS or swarm

#### Example

```js
import { getContent } from '@ensdomains/ui'
const content = await getContent('vitalik.eth')
// ipfs://Qsxz...
```

### `async function getName(address): Name`

This function gets the reverse record of an address.

#### Arguments

address (string): An Ethereum address

#### Returns

name (string): An ENS name

#### Example

```js
import { getName } from '@ensdomains/ui'
const name = await getName('0x123abc...')
// vitalik.eth
```

### `async function setOwner(name, newOwner): EthersTransactionResponse`

#### Arguments

name (string): An ENS name
newOwner (string): An Ethereum address or contract

#### Returns

EthersTransactionObject (object): An [Ethers Transaction Response Object](https://docs.ethers.io/ethers.js/html/api-providers.html#transaction-response)

#### Example

```js
import { setOwner } from '@ensdomains/ui'

const tx = await setOwner('vitalik.eth', '0x123abc...')
console.log(tx.hash)
// 0x123456...
const receipt = await tx.wait() // Wait for transaction to be mined
// Transaction has been mined
```

### `async function setSubnodeOwner(name, newOwner): EthersTransactionResponse`

Can only be called by the controller of the name or the controller of the parent name.

#### Arguments

label (string): ENS Label e.g: sub (sub.vitalik.eth)
name (string): An ENS name
newOwner (string): An Ethereum address or contract

#### Returns

EthersTransactionObject (object): An [Ethers Transaction Response Object](https://docs.ethers.io/ethers.js/html/api-providers.html#transaction-response)

#### Example

```js
import { setSubnodeOwner } from '@ensdomains/ui'

const tx = await setSubnodeOwner('sub', 'vitalik.eth', '0x123abc')
console.log(tx.hash)
// 0x123456...
const receipt = await tx.wait() // Wait for transaction to be mined
// Transaction has been mined
```

### `async function setResolver(name, resolver): EthersTransactionResponse`

Can only be called by the controller of the name.

#### Arguments

name (string): An ENS name
resolver (string): An ENS [resolver contract](https://github.com/ensdomains/resolvers)

#### Returns

EthersTransactionObject (object): An [Ethers Transaction Response Object](https://docs.ethers.io/ethers.js/html/api-providers.html#transaction-response)

#### Example

```js
import { setResolver } from '@ensdomains/ui'

const tx = await setResolver('vitalik.eth', '0x123abc')
console.log(tx.hash)
// 0x123456...
const receipt = await tx.wait() // Wait for transaction to be mined
// Transaction has been mined
```

### `async function setAddress(name, address): EthersTransactionResponse`

Can only be called by the controller of the name.

#### Arguments

name (string): An ENS name
address (string): An Ethereum address

#### Returns

EthersTransactionObject (object): An [Ethers Transaction Response Object](https://docs.ethers.io/ethers.js/html/api-providers.html#transaction-response)

#### Example

```js
import { setAddress } from '@ensdomains/ui'

const tx = await setAddress('vitalik.eth', '0x123abc')
console.log(tx.hash)
// 0x123456...
const receipt = await tx.wait() // Wait for transaction to be mined
// Transaction has been mined
```

### `async function setContent(name, content): EthersTransactionResponse (DEPRECATED)`

Can only be called by the controller of the name.

This function has been deprecated in favour of `setContenthash` which uses [EIP1577](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1577.md)

#### Arguments

name (string): An ENS name
content (string): A content hash

#### Returns

EthersTransactionObject (object): An [Ethers Transaction Response Object](https://docs.ethers.io/ethers.js/html/api-providers.html#transaction-response)

#### Example

```js
import { setContent } from '@ensdomains/ui'

const tx = await setContent('vitalik.eth', '0x123abc')
console.log(tx.hash)
// 0x123456...
const receipt = await tx.wait() // Wait for transaction to be mined
// Transaction has been mined
```

### `async function setContenthash(name, content): EthersTransactionResponse`

Can only be called by the controller of the name.

#### Arguments

name (string): An ENS name
contenthash (string): A content hash defined by [EIP1577](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1577.md)

#### Returns

EthersTransactionObject (object): An [Ethers Transaction Response Object](https://docs.ethers.io/ethers.js/html/api-providers.html#transaction-response)

#### Example

```js
import { setContent } from '@ensdomains/ui'

const tx = await setContent('vitalik.eth', '0x123abc')
console.log(tx.hash)
// 0x123456...
const receipt = await tx.wait() // Wait for transaction to be mined
// Transaction has been mined
```

### `async function checkSubdomain(label, name): EthersTransactionResponse`

#### Arguments

label (string): The label of the subdomain you want you check
name (string): An ENS name

#### Returns

subdomainExists (Boolean): Whether or not the subdomain exists

#### Example

```js
import { setContent } from '@ensdomains/ui'

const subDomainExists = await checkSubDomain('sub', 'vitalik.eth')
console.log(subDomainExists)
// true/false
```

### `async function createSubdomain(label, name): EthersTransactionResponse`

Can only be called by the controller of the name. This is a simplified version of `setSubnodeOwner` which it uses underneath to create a subdomain. It will automatically set the owner to the parent's names owner. If you call this function on an existing subdomain, it will change its owner to the current parent owner.

#### Arguments

label (string): ENS Label e.g: sub (sub.vitalik.eth)
name (string): An ENS name

#### Returns

EthersTransactionObject (object): An [Ethers Transaction Response Object](https://docs.ethers.io/ethers.js/html/api-providers.html#transaction-response)

#### Example

```js
import { deleteSubdomain } from '@ensdomains/ui'

const tx = await createSubdomain('sub', 'vitalik.eth')
console.log(tx.hash)
// 0x123456...
const receipt = await tx.wait() // Wait for transaction to be mined
// Transaction has been mined
```

### `async function deleteSubdomain(label, name): EthersTransactionResponse`

Can only be called by the controller of the name. This function will set the controller to `0x000...` and if it has a resolver, it will set the resolver `0x000...`, which will be a second transaction. Alternatively you can manually call `setSubnodeOwner` and set the controller to `0x000...`

#### Arguments

label (string): ENS Label e.g: sub (sub.vitalik.eth)
name (string): An ENS name

#### Returns

EthersTransactionObject (object): An [Ethers Transaction Response Object](https://docs.ethers.io/ethers.js/html/api-providers.html#transaction-response)

#### Example

```js
import { deleteSubdomain } from '@ensdomains/ui'

const tx = await deleteSubdomain('sub', 'vitalik.eth')
console.log(tx.hash)
// 0x123456...
const receipt = await tx.wait() // Wait for transaction to be mined
// Transaction has been mined
```

### `async function claimAndSetReverseRecordName(name): EthersTransactionResponse`

This function will claim your Ethereum address on the reverse registrar, setup the reverse resolver and setup your name on the resolver all in one transaction. It can also be used to change your reverse record name to something else.

#### Arguments

name (string): An ENS name

#### Returns

EthersTransactionObject (object): An [Ethers Transaction Response Object](https://docs.ethers.io/ethers.js/html/api-providers.html#transaction-response)

#### Example

```js
import { claimAndSetReverseRecordName } from '@ensdomains/ui'

const tx = await claimAndSetReverseRecordName('vitalik.eth')
console.log(tx.hash)
// 0x123456...
const receipt = await tx.wait() // Wait for transaction to be mined
// Transaction has been mined
```

### `async function setReverseRecordName(name): EthersTransactionResponse`

This function will set your reverse record name given that a resolver is already present on your ethereum address reverse name e.g. `123456abcdef.addr.reverse`. This can be useful if you don't want to use `claimAndSetReverseRecordName` to setup the default reverse registrar

#### Arguments

name (string): An ENS name

#### Returns

EthersTransactionObject (object): An [Ethers Transaction Response Object](https://docs.ethers.io/ethers.js/html/api-providers.html#transaction-response)

#### Example

```js
import { setReverseRecordName } from '@ensdomains/ui'

const tx = await setReverseRecordName('vitalik.eth')
console.log(tx.hash)
// 0x123456...
const receipt = await tx.wait() // Wait for transaction to be mined
// Transaction has been mined
```

### `async function getDomainDetails(name): EthersTransactionResponse`

This is a helper function to get all the details for a particular domain.

#### Arguments

name (string): An ENS name

#### Returns

DomainDetails (object): {
name (string): ENS name
label (string): label of the name
labelhash: labelhash of the name
owner (string): Address of the controller of the ENS name
resolver (string): ENS resolver contract
addr (string): Address the ENS name resolves to
content (string): Contenthash the ENS name resolves to
}

#### Example

```js
import { getDomainDetails } from '@ensdomains/ui'

const domainDetails = await getDomainDetails('vitalik.eth')
console.log(domainDetails)
/* 
  {
    name: "vitalik.eth",
    label: "vitalik",
    labelhash: "0x123456abc...",
    owner: "0x123abcdef...",
    resolver: "0x1234abdef...",
    addr: "0xabcdef1234...",
    content: "bzz://Qra123..."
  }
*/
```

### `async function getDomainDetails(name): EthersTransactionResponse`

This is a helper function to get all the details for a particular domain.

#### Arguments

name (string): An ENS name

#### Returns

DomainDetails (object): {
name (string): ENS name
label (string): label of the name
labelhash: labelhash of the name
owner (string): Address of the controller of the ENS name
resolver (string): ENS resolver contract
addr (string): Address the ENS name resolves to
content (string): Contenthash the ENS name resolves to
}

#### Example

```js
import { getDomainDetails } from '@ensdomains/ui'

const domainDetails = await getDomainDetails('vitalik.eth')
console.log(domainDetails)
/* 
  {
    name: "vitalik.eth",
    label: "vitalik",
    labelhash: "0x123456abc...",
    owner: "0x123abcdef...",
    resolver: "0x1234abdef...",
    addr: "0xabcdef1234...",
    content: "bzz://Qra123..."
  }
*/
```

### `async function getSubDomains(name): EthersTransactionResponse`

This is a helper function to get all the subdomains for a name. Internally it will search for events for the `NewOwner` and filter out duplicates.

#### Arguments

name (string): An ENS name

#### Returns

Subdomains (Array<Subdomain>): {
name (string): ENS name
label (string): label of the name
labelhash: labelhash of the name
owner (string): Address of the controller of the ENS name
decrypted (boolean): Whether the label is known or not
}

#### Example

```js
import { getSubDomains } from '@ensdomains/ui'

const subdomains = await getDomainDetails('vitalik.eth')
console.log(subdomains)
/* 
  [{
    name: "vitalik.eth",
    label: "vitalik",
    labelhash: "0x123456abc...",
    owner: "0x123abcdef...",
    decrypted: true
  }, ...]
*/
```

function registerTestdomain(label) {
}

function expiryTimes(label, owner) {
}
