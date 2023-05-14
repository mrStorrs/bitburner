/** @param {NS} ns 
 * uber basic hacking script. 
*/
/** @param {import("../..").NS} ns */
export async function main(ns) {
    await ns.weaken(ns.args[0], { additionalMsec: ns.args[1] });
    if (ns.args[3]) {
        ns.tprint("weaken")
    }
    if(ns.args[5]){
        ns.writePort(1, "endprep," + ns.args[0])
    }
    return; 
}