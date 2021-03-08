import { getQueryData, makeProver } from '@ensdomains/dnsprovejs'
import { Oracle } from '@ensdomains/dnssecoraclejs'
import packet from 'dns-packet'
import { getProvider, getSigner } from './web3'
import { ethers } from 'ethers'

class Claim {
  constructor({ oracle, registrar, isFound, result, textDomain, encodedName }) {
    this.oracle = oracle;
    this.registrar = registrar;
    this.result = result;
    this.isFound = isFound;
    this.textDomain = textDomain;
    this.encodedName = encodedName;
  }

  async getProofData(){
    return await this.oracle.getProofData(this.result);
  }

  /**
   * returns `Oracle <https://dnsprovejs.readthedocs.io/en/latest/libraries.html#oracle>`_ object
   */
  getOracle() {
    return this.oracle;
  }

  /**
   * returns `DnsResult <https://dnsprovejs.readthedocs.io/en/latest/libraries.html#dnsresult>`_ object
   */
  getResult() {
    return this.result;
  }

  /**
   * returns owner ETH address from the DNS record.
   */
  getOwner() {
    return this.result.answer.records[0].data.toString()
      .split('=')[1];
  }
}

class DNSRegistrar {
  constructor(provider, oracleAddress) {
    this.provider = provider
    this.oracleAddress = oracleAddress
  }
  /**
   * returns a claim object which allows you to claim
   * the ownership of a given name on ENS by submitting the proof
   * into DNSSEC oracle as well as claiming the name via the registrar
   * @param {string} name - name of the domain you want to claim
   */
  async claim(name) {
    const encodedName = '0x' + packet.name.encode(name).toString('hex');
    const textDomain = '_ens.' + name;
    let queryResult, oracle, isFound
    try{
      const responses = await getQueryData('TXT', textDomain);
      const prover = makeProver(responses.queries);
      queryResult = await prover.queryWithProof('TXT', textDomain);
      const provider = await getProvider()
      oracle = new Oracle(this.oracleAddress, provider);
  
      const {data, proof} = await oracle.getProofData(queryResult);
      const decodedData = oracle.decodeProofs(data);
      const proofrrset = oracle.decodeRrset(proof);
      isFound = true
    }catch(e){
      isFound = false
    }finally{
      let c = new Claim({
        oracle: oracle,
        result: queryResult,
        isFound,
        registrar: this.registrar,
        textDomain: textDomain,
        encodedName: encodedName
      });
      return c
    }
  }
}
export default DNSRegistrar
