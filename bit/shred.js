/** @param {NS} ns 
 * Batcher attempt 1
*/

var spacer = 30;
var hackPercent = 0.80
const workerDebug = false;
var targetServer = "n00dles";

/** @param {import("../../..").NS} ns */
export async function main(ns) {
    const server = ns.args[0]
    const target = ns.args[1]
    ns.tail()
    // ns.disableLog("ALL");

    let threads = ns.getServerMaxRam(server) / 1.75
    let threadAloc = allocateThreads(ns, threads, 4, target);
    let delays = getDelays(ns, target);

    ns.tprint(delays.hackDelay);
    ns.tprint(threadAloc.hack)
    await ns.sleep(10)
    ns.exec("/bit/hs.js", server, threadAloc.hack, targetServer, delays.hackDelay, "shredder-hack", workerDebug);
    ns.exec("/bit/ws.js", server, threadAloc.weaken, targetServer, delays.weakenDelay1, "shredder-weaken", workerDebug);
    ns.exec("/bit/gs.js", server, threadAloc.grow, targetServer, delays.growDelay, "shredder-grow", workerDebug);
    ns.spawn("/bit/ws.js", threadAloc.weaken2, targetServer, 0, "shredder-weaken2", workerDebug);
}


/** @param {import("../..").NS} ns */
function allocateThreads(ns, threads, minThreads, targetServer) {
    let hack = 1;
    let weaken = 1;
    let grow = 1;
    let weaken2 = 1;
    let hackCost = 0.002
    let hackTotalCost = 0
    let weakenCost = 0.05
    let growCost = 0.004
    let growTotalCost = 0;
    let hackLossFactor = 0;

    var tempHack = 0;
    var tempWeaken = 0;
    var tempGrow = 0;
    var tempWeaken2 = 0;
    let cycleThreads = grow + hack + weaken + weaken2;
    let maxMoney = ns.getServerMaxMoney(targetServer);
    let moneyLeft = 0;
    let moneyLoss = 0;
    //could improve this to get as close to threads as possible.
    // while ((cycleThreads + minThreads) < threads && hackLossFactor < hackPercent) {
    //     tempHack = hack;
    //     tempWeaken = weaken;
    //     tempGrow = grow;
    //     tempWeaken2 = weaken2;

    //     hack++;
    //     hackTotalCost = hackCost * hack;

    //     weaken = Math.ceil((hackTotalCost) / weakenCost)
    //     // if (hackTotalCost - (weaken - 1) * weakenCost > weakenCost) weaken++;
    //     hackLossFactor = hack * ns.hackAnalyze(targetServer);
    //     moneyLoss = maxMoney * hackLossFactor;
    //     moneyLeft = maxMoney - moneyLoss;

    //     grow = Math.ceil(ns.growthAnalyze(targetServer, maxMoney / moneyLeft));
    //     growTotalCost = growCost * grow;

    //     weaken2 = Math.ceil((growTotalCost) / weakenCost)
    //     cycleThreads = (hack + weaken + grow + weaken2);
    //     // if (growTotalCost - (weaken2 - 1) * weakenCost > weakenCost) weaken2++;
    // }
    // grow = Math.ceil(grow); 

    //we estimated too many threads. use previous. 
    // if ((cycleThreads) > threads) {
        hack = 4;
        weaken = 2;
        grow = 8;
        weaken2 = 2;
    // }

    return {
        hack,
        weaken,
        grow,
        weaken2
    };
}

function getDelays(ns, targetServer) {
    let weakenTime = ns.getWeakenTime(targetServer);
    let growTime = ns.getGrowTime(targetServer);
    let hackTime = ns.getHackTime(targetServer);

    let delays = {
        hackDelay: weakenTime - spacer - hackTime,
        weakenDelay1: 0,
        growDelay: weakenTime + spacer - growTime,
        weakenDelay2: spacer * 2,
        batchDelay: weakenTime + spacer * 10
    }

    return delays;
}
