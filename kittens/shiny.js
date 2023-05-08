/** @param {NS} ns 
 * Script that will first buy servers and then attempt to keep them upgraded. 
*/
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

    ns.run("/scan/scan.js");
    ns.run("/kittens/zombie.js") //need new servers to have the goods.    


    var nextServerUpgIdx = 0
    var ram = ns.getServerMaxRam(servers[0]);
    // var moneyLimit = 1000000000000; //trillion 
    var moneyLimit = 1000000; //trillion 
    // var moneyLimit = 10000000000000000000000000000000000000000; //trillion 
    var ramlimit = 1050000; //trillion 
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
    if(serverRam = ns.getServerMaxRam(servers[24])){
        ram = ram * 2
    }
    // Infinite loop that continously hacks/grows/weakens the target server
    while (true) {
        let server = servers[nextServerUpgIdx];
        if (ns.getServerMoneyAvailable("home") - ns.getPurchasedServerUpgradeCost(server, ram) > moneyLimit && ns.getServerMaxRam(server) < ramLimit) {
            ns.print("upgrading: " + server + " to ram: " + ram);
            ns.upgradePurchasedServer(server, ram);
            nextServerUpgIdx++;
        }
        if (nextServerUpgIdx > 24) {
            ram *= 2;
            nextServerUpgIdx = 0;
        }
        await ns.sleep(10);
    }
}