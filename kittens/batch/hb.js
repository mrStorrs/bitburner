/** @param {NS} ns 
 * uber basic hacking script. 
*/
var hackResult;
import { getGlobal } from '/bb-vue/lib.js'
export async function main(ns) {
    // ns.tail();
    let bus = getGlobal('testBus')
    hackResult = await ns.hack(ns.args[0], { additionalMsec: ns.args[1] });
    if (hackResult < (ns.args[4] * 0.90)) bus.emit('testEmitter', { value: "badHack"});
    else bus.emit('testEmitter', { value: "goodHack" })
    if (hackResult < (ns.args[4] * 0.90)) ns.tprint("low hacked moneys: " + Math.floor(hackResult) + " on: " + ns.args[0]);

    // else ns.tprint("successful hack")
    if(ns.args[3]){
        ns.tprint("hack")
    }
    return; 
}
