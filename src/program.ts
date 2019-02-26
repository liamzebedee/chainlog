import Web3 from 'web3';
import { Config } from './iconfig';
import { Blockchain } from './blockchain';
import { renderTerminalUI } from './ui'

export class Program {
    conf: Config;
    chain: Blockchain;

    constructor() {
        this.conf = Config.load()
        this.chain = new Blockchain(this.conf.rpcUrl)
    }

    async run() {
        await this.chain.connect()
        // console.log('Connected!');
        
        // now load all contracts
        await this.chain.loadContracts(
            this.conf
        )

        // renderTerminalUI({
        //     chain: this.chain
        // })
    }

    async stop() {
        await this.chain.disconnect()
    }
}

