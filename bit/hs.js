/** @param {NS} ns 
 * uber basic hacking script. 
*/
export async function main(ns) {
    while(true){
        await ns.hack(ns.args[0], { additionalMsec: ns.args[1] });
        if (ns.args[3]) {
            ns.tprint("hack")
        }
    }
}