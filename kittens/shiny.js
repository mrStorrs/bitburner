/** @param {NS} ns 
 * Script that will first buy servers and then attempt to keep them upgraded. 
*/

// 100000 or 200000 seeems to be max rate 4 one server
//this could be easily found out. take weaken time and divide
//it by the buffer * buffer mult.       
const ramLimit = 200000; //trillion 
const moneyLimit = 50000; 
export async function main(ns) {
    var servers = ns.getPurchasedServers();
    ns.tail();

    ns.disableLog("getServerMoneyAvailable")
    ns.disableLog("sleep")
    ns.disableLog("getServerMaxRam")
    ns.disableLog("getScriptRam")

    while(servers.length < 25){
        let name = "hamster"
        ns.purchaseServer(name, 8);
        await ns.sleep(10);
        servers = ns.getPurchasedServers();
    }

    var nextServerUpgIdx = 0
    var ram = ns.getServerMaxRam(servers[0]);
    // var moneyLimit = 1000000000000; //trillion 
    // var moneyLimit = 10000000000000000000000000000000000000000; //trillion 
    let serverRam = 0; 
    for (let i = 1; i < servers.length; i++) {
        let server = servers[i];
        serverRam = ns.getServerMaxRam(server);

        if (serverRam < ram) {
            nextServerUpgIdx = i;
            break;
        }
    }


    //this is incase we just purchased all servers and they are all at 
    //the exact same level of ram. 
    if(serverRam == ns.getServerMaxRam(servers[24])){
        ram = ram * 2
    }
    // Infinite loop that continously hacks/grows/weakens the target server
    while (true) {
        let server = servers[nextServerUpgIdx];
        // ns.tprint(ns.getServerMaxRam(server))
        // ns.tprint(ramLimit)
        if (ns.getServerMoneyAvailable("home") - ns.getPurchasedServerUpgradeCost(server, ram) > moneyLimit && ns.getServerMaxRam(server) < ramLimit) {
            ns.print("upgrading: " + server + " to ram: " + ram);
            ns.upgradePurchasedServer(server, ram);
            nextServerUpgIdx++;
            await ns.sleep(500);
        }
        if (nextServerUpgIdx > 24) {
            ram *= 2;
            nextServerUpgIdx = 0;
        }
        await ns.sleep(10);
    }
}