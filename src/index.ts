import { Program } from "./program";

let program = new Program()
program.run()
.then(() => {})
.catch(ex => {
    throw ex
})

process.on('exit', async () => {
    await program.stop()
})

