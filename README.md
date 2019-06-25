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

###`async function getOwner(name)`

#### Arguments

name (string): An ENS name (e.g: vitalik.eth)

#### Returns

owner (address): Ethereum address of the owner on the registry

#### Example

```js
const name = 'vitalik.eth'
const owner = await getOwner('vitalik.eth')
// 0x123...
```

###`async function getResolver(name)`

#### Arguments

name (string): An ENS name (e.g: vitalik.eth)

#### Returns

owner (address): Ethereum address of the resolver contract

####Example

```js
const owner = await getResolver('vitalik.eth')
// 0x123...
```

function getResolverWithLabelHash(labelHash, nodeHash) {
}

function getOwnerWithLabelHash(labelHash, nodeHash) {
}

function registerTestdomain(label) {
}

function expiryTimes(label, owner) {
}

function getAddr(name) {
}

function getContent(name) {

}

function getName(address) {

}

function setOwner(name, newOwner) {
}

function setSubnodeOwner(unnormalizedLabel, node, newOwner) {
}

function setResolver(name, resolver) {
}

function setAddress(name, address) {
}

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
