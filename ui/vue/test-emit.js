import { getGlobal } from '/bb-vue/lib.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
    ns.tail();
    let bus = getGlobal('testBus')
    if (!bus) {
        throw new Error('Run the asciichart-ui.js script first!')
    }
    let index = 0; 

    while (true) {
        bus.emit('testEmitter', { value: index})
        index++; 
        await ns.sleep(50)
    }
}
