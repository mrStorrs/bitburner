/**
 * this will individually issue script commands to differant servers depending on what needs to be done. 
 * 
 * may want to add a trigger ffor checking for new available servers. 
 */
export async function main(ns) {
    const servers = ns.read("/lib/serversNuked.js").split(",")
    const bestTarget = ns.read("/lib/serversTarget.js")
    const moneyThresh = ns.getServerMaxMoney(bestTarget) * 0.90;
    const securityThresh = ns.getServerMinSecurityLevel(bestTarget) + 5;
    // const growTime = ns.getGrowTime(bestTarget); 
    // const spreadTime = Math.floor(growTime / servers.length + 1); 
    const spreadTime = 2000; 
    let threads = 1; 
    let firstLoop = true; 
    ns.tail()

    ns.disableLog("getServerSecurityLevel")
    ns.disableLog("getServerMoneyAvailable")
    ns.disableLog("sleep")
    ns.disableLog("getServerMaxRam")
    ns.disableLog("getServerUsedRam")
    ns.disableLog("getScriptRam")

    //testing
    ns.print(ns.getGrowTime(bestTarget));
    ns.print(ns.getWeakenTime(bestTarget));
    ns.print(ns.getHackTime(bestTarget));

    while (true){
        for (let server of servers) {
            threads = 1; 
            if (server == "home" || server == ".hamster") continue; //temp skipping home for testing new batch. REMOVE ME LATER
            if (!server || !ns.hasRootAccess(server)) continue; // no root access skippy. 
            if (hasMemory(ns, server)) {
                if (ns.getServerSecurityLevel(bestTarget) > securityThresh) {
                    threads = getThreads(ns, server, "/kittens/w.js"); 
                    // If the server's security level is above our threshold, weaken it
                    ns.exec("/kittens/w.js", server, threads, bestTarget)
                } else if (ns.getServerMoneyAvailable(bestTarget) < moneyThresh) {
                    threads = getThreads(ns, server, "/kittens/g.js"); 
                    // If the server's money is less than our threshold, grow it
                    ns.exec("/kittens/g.js", server, threads, bestTarget)
                } else {
                    threads = getThreads(ns, server, "/kittens/h.js"); 
                    // Otherwise, hack it
                    ns.exec("/kittens/h.js", server, threads, bestTarget)
                }
                // ns.tprint("Lets get chomping! server: " + server + " || target: " + bestTarget + " || threads: " + threads);
            }
            if(firstLoop) await ns.sleep(spreadTime); //on initial delagater start stagger the servers to better gauge when to run hacks. 
        }
        firstLoop = false; 
        await ns.sleep(1);
    }

}

function hasMemory(ns, server) {
    let ramLeft = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
    if (server == "home") ramLeft -= 10; 
    if (ramLeft > ns.getScriptRam("/kittens/h.js")) return true;
    else return false;
}

function getThreads(ns, server, script) {
    let ramLeft = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
    if (server == "home") ramLeft -= 10; 
    let threads = Math.floor(ramLeft / ns.getScriptRam(script));
    if(threads < 1) return 1; 
    else return threads;
}

