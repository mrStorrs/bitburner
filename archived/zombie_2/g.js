/** @param {NS} ns 
 * uber basic hacking script. 
*/
export async function main(ns) {
    await ns.grow(ns.args[0]);
    return; 
}