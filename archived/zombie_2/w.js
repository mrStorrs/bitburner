/** @param {NS} ns 
 * uber basic hacking script. 
*/
export async function main(ns) {
    await ns.weaken(ns.args[0]);
    return; 
}