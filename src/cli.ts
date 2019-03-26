#!/usr/bin/env node
import Web3 from 'web3';
import { Config } from './iconfig';
import { Blockchain } from './blockchain';
import { renderTerminalUI } from './ui'

export class Program {
    conf: Config;
    chain: Blockchain;

    constructor() {
        let configPath = './chainlog.yml'
		 
		const argv = require('minimist')(process.argv.slice(2), {
			string: 'config'
		});

		// chainlog --config x.yml
		if(!argv.config) throw new Error("--config PATH not specified")
        configPath = argv.config;
        
        this.conf = Config.load(configPath)
        this.chain = new Blockchain(this.conf.rpcUrl)
    }

    async run() {
        await this.chain.connect()
        
        // now load all contracts
        await this.chain.loadContracts(
            this.conf
        )
    }

    async stop() {
        await this.chain.disconnect()
    }
}


let program = new Program()
program.run()
.then(() => {})
.catch(ex => {
    throw ex
})

process.on('exit', async () => {
    await program.stop()
})