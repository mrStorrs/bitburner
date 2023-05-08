/** @param {NS} ns 
 * Simple scanner program that will scan all servers and then save
 * it to the spefied servers file. 
*/
const SCANNERS = ["/scan/scan.js", "/scan/scanInd.js", "/scan/scanNuked.js", "/scan/scanTarget.js"];

export async function main(ns) {
    while(true){
        for(let scanner of SCANNERS){
            ns.run(scanner);
            await ns.sleep(5000)
        }
        await ns.sleep(120000) //rebuild every 2 minutes
        await ns.run("/kittens/rampage.js");
    }
}

