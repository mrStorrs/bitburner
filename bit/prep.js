/** @param {NS} ns 
 * uber basic hacking script. 
*/
/** @param {import("../../.").NS} ns */
export async function main(ns) {
    let targetServer = ns.args[0];
    let security = 100;
    let money = 100000; 
    while (security > 2 || money > 25000){
        security = ns.getServerSecurityLevel(targetServer) - ns.getServerMinSecurityLevel(targetServer)
        money = ns.getServerMaxMoney(targetServer) - ns.getServerMoneyAvailable(targetServer)

        if(security > 2){
            await ns.weaken(targetServer);
        } 
        if(money > 25000){
            await ns.grow(targetServer); 
        }
    }
    return;
}