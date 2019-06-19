import contentHash from 'content-hash'
import { utils } from 'ethers'

const supportedCodecs = ['ipfs-ns', 'swarm-ns']

export function decodeContenthash(encoded) {
  let decoded, protocolType, error
  if (encoded.error) {
    return { protocolType: null, decoded: encoded.error }
  }
  if (encoded) {
    try {
      decoded = contentHash.decode(encoded)
      const codec = contentHash.getCodec(encoded)
      if (codec === 'ipfs-ns') {
        protocolType = 'ipfs'
      } else if (codec === 'swarm-ns') {
        protocolType = 'bzz'
      } else {
        decoded = encoded
      }
    } catch (e) {
      error = e.message
    }
  }
  return { protocolType, decoded, error }
}

export function isValidContenthash(encoded) {
  try {
    const codec = contentHash.getCodec(encoded)
    return utils.isHexString(encoded) && supportedCodecs.includes(codec)
  } catch (e) {
    console.log(e)
  }
}

export function encodeContenthash(text) {
  let content, contentType
  let encoded = false
  if (!!text) {
    let matched = text.match(/^(ipfs|bzz):\/\/(.*)/)
    if (matched) {
      contentType = matched[1]
      content = matched[2]
    }

    try {
      if (contentType === 'ipfs') {
        encoded = '0x' + contentHash.fromIpfs(content)
      } else if (contentType === 'bzz') {
        encoded = '0x' + contentHash.fromSwarm(content)
      } else {
        console.warn('Unsupported protocol or invalid value', {
          contentType,
          text
        })
      }
    } catch (err) {
      console.warn('Error encoding content hash', { text, encoded })
      throw 'Error encoding content hash'
    }
  }
  return encoded
}
