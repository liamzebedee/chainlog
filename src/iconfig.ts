// interface IConfig {
// 	rpcUrl: string;
// 	contractSources: string;
// 	contractArtifacts: string;
// 	contractAddresses: string;
// }
// simple yaml file

const yaml = require('js-yaml');
import {
	readFileSync,
	existsSync
} from 'fs';

import {
	resolve
} from 'path'

import { Map, Set } from 'immutable';


export class Config {
	contractSources: string[];

	truffle: false;
	contractArtifactsPath: string;
	contractAddresses: Map<string, Set<string>>;
	watchNewContracts: boolean;
	rpcUrl: string;

	constructor() {
	}

	static load(configPath: string): Config {
		try {
			console.log(`Loading config from ${resolve(configPath)}`)
			let doc = yaml.safeLoad(readFileSync(resolve(configPath), 'utf8'));
			// console.log('config', doc);
			
			let config = new Config
			config.rpcUrl = doc.rpcUrl;
			config.contractArtifactsPath = resolve(doc.contracts.artifacts)
			// if(!existsSync(config.contractArtifactsPath)) throw new Error(`contractArtifactsPath: ${config.contractArtifactsPath} doesn't exist`)
			// console.log(`loading from ${config.contractArtifactsPath}`)
			
			let addresses = Map<string, Set<string>>();

			doc.contracts.addresses.map(obj => {
				let [ contractName, address ] = Object.entries(obj)[0]
				addresses = addresses.update(
					contractName, 
					Set<string>(), 
					(s: Set<string>) => s.add(address as string)
				)
			})
			config.contractAddresses = addresses;

			config.watchNewContracts = doc.contracts.watch_new;

			config.truffle = doc['contracts']['truffle'] || false;

			// console.log(config)
			return config;

		} catch (e) {
			console.log(e);
		}
	}
}