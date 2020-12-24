import DnsProve from '@ensdomains/dnsprovejs'
import dnsRegistrarContract from '@ensdomains/contracts/abis/dnsregistrar/DNSRegistrar.json'
import packet from 'dns-packet'
const abi = dnsRegistrarContract.abi;

class Claim {
  constructor({ oracle, registrar, result, textDomain, encodedName }) {
    this.oracle = oracle;
    this.registrar = registrar;
    this.result = result;
    this.textDomain = textDomain;
    this.encodedName = encodedName;
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
    return this.result.results[this.result.results.length - 1].rrs[0].data[0]
      .toString()
      .split('=')[1];
  }
}

class DNSRegistrar {
  constructor(provider, oracleAddress) {
    this.provider = provider
    this.oracleAddress = oracleAddress
    this.dnsprover = new DnsProve(provider);
  }
  /**
   * returns a claim object which allows you to claim
   * the ownership of a given name on ENS by submitting the proof
   * into DNSSEC oracle as well as claiming the name via the registrar
   * @param {string} name - name of the domain you want to claim
   */
  async claim(name) {
    let encodedName = '0x' + packet.name.encode(name).toString('hex');
    let textDomain = '_ens.' + name;
    let result = await this.dnsprover.lookup('TXT', textDomain);
    let oracle = await this.dnsprover.getOracle(this.oracleAddress);
    return new Claim({
      oracle: oracle,
      result: result,
      registrar: this.registrar,
      textDomain: textDomain,
      encodedName: encodedName
    });
  }
}
export default DNSRegistrar