import { Config } from "./iconfig";
import { Blockchain } from "./blockchain";

export default async function(opts: { config: string }) {
    let conf = Config.load(opts.config)
    let chain = new Blockchain(conf.rpcUrl)
    await chain.connect()
    // now load all contracts
    await chain.loadContracts(
        conf
    )

    process.on('exit', async () => {
        await chain.disconnect()
    })
}