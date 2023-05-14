/** @param {NS} ns 
 * uber basic hacking script. 
*/
export async function main(ns) {
    await ns.grow(ns.args[0], { additionalMsec: ns.args[1] });

    while(true){
        if (ns.args[3]) {
            ns.tprint("grow")
        }
        await ns.grow(ns.args[0], { ad})
    }

    return; 
}