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

function setContent(name, content) {
}

function setContenthash(name, content) {
}

function checkSubDomain(subDomain, domain) {
}

function buildSubDomain(label, node, owner) {
}

function createSubdomain(subdomain, domain) {
}

function deleteSubdomain(subdomain, domain) {
}

function claimAndSetReverseRecordName(name, gas) {
}

function setReverseRecordName(name) {
}

function getDomainDetails(name) {
return {
...node,
addr: null,
content: null
}
}

const getSubDomains = name => {
{
return {
label: labels[index],
labelHash: logs[index].label,
decrypted: labels[index] !== null,
node: name,
name: `${labels[index] || encodeLabelhash(logs[index].label)}.${name}`,
owner
}
}
}

function registerTestdomain(label) {
}

function expiryTimes(label, owner) {
}
