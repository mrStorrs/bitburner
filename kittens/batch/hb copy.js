/** @param {NS} ns 
 * uber basic hacking script. 
*/
var hackResult;
export async function main(ns) {
    hackResult = await ns.hack(ns.args[0], { additionalMsec: ns.args[1] });
    if(hackResult < (ns.args[4] * 0.90)) ns.tprint("low hacked moneys: " + Math.floor(hackResult) + " on: " + ns.args[0]);
    if(ns.args[3]){
        ns.tprint("hack")
    }
    return; 
}
