

import { ethers } from 'ethers';
import { Map, Set } from 'immutable';
import { Config } from './iconfig';
import { TransactionResponse } from 'ethers/providers';
import { EventEmitter } from 'events';
const fastglob = require('fast-glob');
const chalk = require('chalk');


// import { RPCSubprovider, Web3ProviderEngine } from '0x.js';
// import { RevertTraceSubprovider, SolCompilerArtifactAdapter } from '@0x/sol-trace';

export class Blockchain {
    rpcUrl: string;
    provider: ethers.providers.JsonRpcProvider;

    contracts = Map<string, ethers.Contract>();
    artifacts = Map<string, any>()
    // Addresses to contract name
    addresses = Map<string, string>()

    events = new EventEmitter();
    truffle: boolean;

    constructor(rpcUrl: string) {
        this.rpcUrl = rpcUrl;
    }

    async connect() {
        this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
        this.provider.polling = true;
        this.provider.pollingInterval = 500;
        await this.provider.getBlock('latest')
        const CONNECT_TIMEOUT = 7500;

        await new Promise((res, rej) => {
            this.provider.on('block', res);
            setTimeout(
                _ => {
                    rej(new Error(`Ethers.js couldn't connect after ${CONNECT_TIMEOUT}ms`))
                }, 
                CONNECT_TIMEOUT
            );
        });
    }

    async disconnect() {
        this.provider = null;
    }

    async loadContracts(
        conf: Config
    ) {
        this.truffle = conf.truffle;

        const artifactFiles = fastglob.sync(
            [ conf.contractArtifactsPath ],
            { onlyFiles: true, absolute: true }
        );

        if(!artifactFiles.length) throw new Error(`no contract artifacts found in glob path ${conf.contractArtifactsPath}`)

        artifactFiles.map(fname => {
            let artifact = require(fname)
            this.artifacts = this.artifacts.set(artifact.contractName, artifact);
        })

        conf.contractAddresses.map((addrs, name) => {
            addrs.map(addr => {
                if(!this.artifacts.has(name)) throw new Error(`no artifact for contract ${name}`);
                this.loadContractInstance(addr, name)
            })
        })


        this.provider.on('block', async blockNum => {
            let block = await this.provider.getBlock(blockNum)

            block.transactions.map(async txhash => {
                let tx = await this.provider.getTransaction(txhash)

                return Promise.all([
                    this.checkContractDeployed(txhash),
                    this.checkContractCall(tx)
                ])
            })
        })
        
        return
    }

    private loadContractInstance(addr: string, name: string) {
        let c = new ethers.Contract(
            addr,
            this.getArtifactInfo(this.artifacts.get(name)).abi,
            this.provider
        )
        this.contracts = this.contracts.set(addr, c);
        this.addresses = this.addresses.set(addr, name)

        // this.contracts.forEach(this.listen)
        this.listen(c, addr);
    }

    async checkContractDeployed(txhash: string) {
        let rec = await this.provider.getTransactionReceipt(txhash)
        
        // console.log(rec)
        if(rec.contractAddress) {
            let code = await this.provider.getCode(rec.contractAddress)
            // console.log(`deployed`, code)
            // console.log(rec)
            let entry = this.artifacts.findEntry((artifact, name) => {
                return this.getArtifactInfo(artifact).deployedBytecode === code
            })

            
            
            if(entry) {
                let [ name, _ ] = entry;
                let addr = rec.contractAddress;
                console.log(`${chalk.green(name)} deployed at ${addr}`);
                this.loadContractInstance(addr, name)
            }

        }
    }

    async checkContractCall(tx: TransactionResponse) {
        if(!tx.to) return;

        let addr = tx.to.toLowerCase()
        let contract = this.contracts.get(addr)

        if(contract) {
            let txdesc = contract.interface.parseTransaction(tx)
            let name = this.addresses.get(addr)

            this.emitEvent({
                name,
                addr,
                tx,
                txdesc,
                eventKey: 'call'
            } as ContractFunctionCalled)
            // console.log(`${name} CALL - ${JSON.stringify(txdesc)}`)
        }
    }


    listen = async (c: ethers.Contract, addr: string) => {
        
        // listen to events
        let self = this;
        c.on('*', function() {
            let args = Array.from(arguments)
            let ev: ethers.Event;

            if(args.length > 1) {
                ev = args.pop()
            } else {
                ev = args[0];
            }

            let name = self.addresses.get(addr);
            const convertResultArray = (res) => {
                let arr = new Array(res.length);
                for(let i = 0; i < res.length; i++) {
                    arr[i] = res[i];
                }
                return arr;
            }

            self.emitEvent({
                name,
                addr,
                args: convertResultArray(ev.args).map(el => el.toString()),
                ev,
                evname: ev.event,
                eventKey: 'event'
            } as ContractEventEmitted)
            // console.log(`${name} EVENT - ${JSON.stringify(ev.args)}`)
        })
    }

    emitEvent(ev: ContractEventEmitted | ContractFunctionCalled) {
        let str = [];   
        let name;
        let func;
        let args;


        switch(ev.eventKey) {
            case 'event':
                name = ev.name;
                func = ev.evname;
                args = ev.args;
                break
            case 'call':
                name = ev.name;
                func = ev.txdesc.name;
                args = ev.txdesc.args;
                break;
        }

        console.log(`${chalk.green(name)}.${chalk.yellow(func)}(${args.join(', ')})`);

        this.events.emit(ev.eventKey, ev)
    }

    private getArtifactInfo(artifact: any): ArtifactInfo {
        if(this.truffle) {
            return {
                abi: artifact.abi,
                deployedBytecode: artifact.deployedBytecode
            }
        } else {
            return {
                abi: artifact.compilerOutput.abi,
                deployedBytecode: artifact.compilerOutput.evm.deployedBytecode.object
            }
        }
    }
}

type ArtifactInfo = {
    abi: any[];
    deployedBytecode: string;
}



type Event = {
    eventKey: string;
}

type ContractEvent = Event & {
    name: string;
    addr: string;
}

export type ContractEventEmitted = ContractEvent & {
    ev: any;
    evname: string;
    eventKey: 'event';
    args: any[];
}

export type ContractFunctionCalled = ContractEvent & {
    tx: any;
    txdesc: any;
    eventKey: 'call';
}

export type ContractDeployed = ContractEvent & {
    eventKey: 'deploy';
}