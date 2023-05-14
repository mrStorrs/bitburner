/** @param {NS} ns 
 * Batcher attempt 1
*/

//todo:
// - need to add scan..rampage..infect stage
// - need to automate buying tor router and purchase from darkweb
// - add run command for shiny
var spacer = 30;
var scripts = ["/kittens/batch/hb.js", "/kittens/batch/wb.js", "/kittens/batch/gb.js", "/kittens/batch/wb.js"]
//make this dynamically change based on how much ram
//purchased servers have. this could be done by determinging how much ram
//it takes to do 
var hackPercent = 0.80
var batchIdx = 1
var prepIdx = 1;
var isPrepping = false;
var allowLowRamBatch = false;
var batchingStarted = false;
const hackScriptCost = 1.75;
const prepScriptCost = 2.30;
const workerDebug = false;
var stage = 0;
var targetServer = "n00dles";

/** @param {import("../../..").NS} ns */
export async function main(ns) {
    const server = args[0]
    const target = args[1]
    ns.tail()
    ns.disableLog("ALL");

    let threadAloc = allocateThreads(ns, ns.getServerMaxRam(server), 4, target);
    let delays = getDelays(ns, target); 

    ns.exec("/kittens/batch/hb.js", server, threadAloc.hack, targetServer, delays.hackDelay, "shredder-hack", workerDebug);
    ns.exec("/kittens/batch/wb.js", server, threadAloc.weaken, targetServer, delays.weakenDelay1, "shredder-weaken", workerDebug);
    ns.exec("/kittens/batch/gb.js", server, threadAloc.grow, targetServer, delays.growDelay, "shredder-grow", workerDebug);
    ns.exec("/kittens/batch/gb.js", server, threadAloc.grow, targetServer, delays.weakenDelay2, "shredder-weaken", workerDebug);



}


//creating this to grab server stats all 
//at once so we don't have to reuse these 
//commands resulting in ram waste. 
function getServerStats(ns, server, targetServer) {

    let serverStats = {
        availableRam: ns.getServerMaxRam(server) - ns.getServerUsedRam(server),
        security: ns.getServerSecurityLevel(targetServer) - ns.getServerMinSecurityLevel(targetServer),
        money: ns.getServerMaxMoney(targetServer) - ns.getServerMoneyAvailable(targetServer),
        maxMoney: ns.getServerMaxMoney(targetServer)
    }
    return serverStats;
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
    while ((cycleThreads + minThreads) < threads && hackLossFactor < hackPercent) {
        tempHack = hack;
        tempWeaken = weaken;
        tempGrow = grow;
        tempWeaken2 = weaken2;

        hack++;
        hackTotalCost = hackCost * hack;

        weaken = Math.ceil((hackTotalCost) / weakenCost)
        // if (hackTotalCost - (weaken - 1) * weakenCost > weakenCost) weaken++;
        hackLossFactor = hack * ns.hackAnalyze(targetServer);
        moneyLoss = maxMoney * hackLossFactor;
        moneyLeft = maxMoney - moneyLoss;

        // ns.tprint(moneyLeft)
        // ns.tprint(moneyLoss)
        // ns.tprint(targetServer)
        grow = Math.ceil(ns.growthAnalyze(targetServer, maxMoney / moneyLeft) * 2);
        growTotalCost = growCost * grow;

        weaken2 = Math.ceil((growTotalCost) / weakenCost)
        cycleThreads = (hack + weaken + grow + weaken2);
        // if (growTotalCost - (weaken2 - 1) * weakenCost > weakenCost) weaken2++;
    }
    // grow = Math.ceil(grow); 

    //we estimated too many threads. use previous. 
    if ((cycleThreads) > threads) {
        hack = tempHack;
        weaken = tempWeaken;
        grow = tempGrow;
        weaken2 = tempWeaken2;
    }
    //  else if (cycleThreads < threads){
    //     //adding some grow buffer. 
    //     while(cycleThreads < threads && cycleThreads < 2){
    //         grow++;
    //         cycleThreads++; 
    //     }
    // }


    // ns.tprint(hack)
    // ns.tprint(weaken)
    // ns.tprint(grow)
    // ns.tprint(weaken2)

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

function getMinimumThreadsReq(ns, targetServer) {
    let hackLossFactor = ns.hackAnalyze(targetServer);
    let maxMoney = ns.getServerMaxMoney(targetServer);
    let moneyLoss = maxMoney * hackLossFactor;
    let moneyLeft = maxMoney - moneyLoss;
    let grow = Math.ceil(ns.growthAnalyze(targetServer, maxMoney / moneyLeft));
    //1 per each weaken and hack. plus growth.

    return 3 + grow;
}

/** @param {import("../..").NS} ns */
function getTarget(ns, callServer, currentTarget, hackLevel, indServers) {
    let newTarget = currentTarget;
    // ns.tprint(indServers);
    let bestT = getBestTarget(ns, callServer, indServers)
    // ns.tprint(bestT); 

    let hamRam = 0;
    if (ns.getPurchasedServers().length > 24) {
        hamRam = ns.getServerMaxRam("hamster-23")
    } else {
        hamRam = 0;
    }

    if (hackLevel > 3000 && hamRam > 500000 && stage < 3) {
        // ns.exec("/scan/scanTarget.js", "home")
        // let bestT = ns.read("/lib/serversTarget.js")
        if (currentTarget != bestT) {
            if (ns.hasRootAccess(bestT) && ns.getServerMaxMoney(bestT) > ns.getServerMaxMoney(currentTarget)) {
                newTarget = bestT;
                stage = 3;
                ns.tprint("enterign stage: " + stage + " target: " + newTarget)
                batchingStarted = false;
                return newTarget;
            }
        }
    } else if (hackLevel > 2000 && hamRam > 4000 && stage < 2) {
        // ns.exec("/scan/scanTarget.js", "home")
        // let bestT = ns.read("/lib/serversTarget.js")
        if (ns.hasRootAccess(bestT) && ns.getServerMaxMoney(bestT) > ns.getServerMaxMoney(currentTarget)) {
            if (ns.hasRootAccess(bestT)) {
                newTarget = bestT;
                stage = 2;
                ns.tprint("enterign stage: " + stage + " target: " + newTarget)
                batchingStarted = false;
                return newTarget;
            }
        }
    } else if (hackLevel > 1000 && hamRam > 1000 && stage < 1) {
        // ns.exec("/scan/scanTarget.js", "home")
        // let bestT = ns.read("/lib/serversTarget.js")
        if (ns.hasRootAccess(bestT) && ns.getServerMaxMoney(bestT) > ns.getServerMaxMoney(currentTarget)) {
            if (ns.hasRootAccess(bestT)) {
                newTarget = bestT;
                stage = 1;
                ns.tprint("enterign stage: " + stage + " target: " + newTarget)
                batchingStarted = false;
                return newTarget;
            }
        }
    }
    return currentTarget;
}

function initiatePrepJob(ns, threadsAvailable, server, targetServer, serverStats, delays) {
    let security = serverStats.security;
    let wThreads1 = 0;

    while (security > 0 && wThreads1 < threadsAvailable) {
        wThreads1++;
        security = security - 0.05;
    }
    if (wThreads1 > 0) ns.exec("/kittens/batch/wb.js", server, wThreads1, targetServer, 0, "prepw-" + prepIdx, workerDebug);

    let gThreadsNeeded = 0;
    if (serverStats.money > 0) {
        gThreadsNeeded = Math.ceil(ns.growthAnalyze(targetServer, (ns.getServerMaxMoney(targetServer) / serverStats.money + 1)));
    }
    let gThreads = 0;
    while (gThreads < gThreadsNeeded && wThreads1 + gThreads < threadsAvailable) {
        gThreads++;
    }
    if (gThreads > 0) ns.exec("/kittens/batch/gb.js", server, gThreads, targetServer, delays.growDelay, "prepg-" + prepIdx, workerDebug);
    let wThreads2 = threadsAvailable - gThreads - wThreads1;
    if (wThreads2 > 0) {
        ns.exec("/kittens/batch/wb.js", server, wThreads2, targetServer, delays.weakenDelay2, "prepw2-" + prepIdx, workerDebug);
    }
    return;
}

function getBestTarget(ns, callServer, indServers) {
    let servers = indServers
    let bestTarget = "n00dles"
    let highestWeight = 0;
    // ns.tail();

    //find best target. 
    for (let server of servers) {
        // ns.tprint(server); 
        if (!server) continue;
        if (server == "home") continue; // we don't want to target ourselves. 
        // ns.getServerMaxMoney(server) //just want to see how much mula on this thing
        let w = weight(ns, server);
        if (w > highestWeight) {
            highestWeight = w;
            bestTarget = server;
            // ns.print("new best target: " + bestTarget)
        }
        // await ns.sleep(5);
    }
    ns.tprint("best target is: " + bestTarget)
    // ns.write(serverTargetFile, bestTarget, "w")
    if (callServer = "home") {
        ns.exec("/kittens/rampage.js", callServer);
    }
    return bestTarget;

    function weight(ns, server) {
        if (!ns.hasRootAccess(server)) return 0; // no root access this server sucks.
        let player = ns.getPlayer();
        let so = ns.getServer(server);

        // Set security to minimum on the server object (for Formula.exe functions)
        so.hackDifficulty = so.minDifficulty;

        // We cannot hack a server that has more than our hacking skill so these have no value
        if (so.requiredHackingSkill > player.skills.hacking) return 0;

        // Default pre-Formulas.exe weight. minDifficulty directly affects times, so it substitutes for min security times
        let weight = so.moneyMax / so.minDifficulty;

        // If we have formulas, we can refine the weight calculation
        if (ns.fileExists('Formulas.exe')) {
            // We use weakenTime instead of minDifficulty since we got access to it, 
            // and we add hackChance to the mix (pre-formulas.exe hack chance formula is based on current security, which is useless)
            weight = so.moneyMax / ns.formulas.hacking.weakenTime(so, player) * ns.formulas.hacking.hackChance(so, player);
        }
        else
            // If we do not have formulas, we can't properly factor in hackchance, so we lower the hacking level tolerance by half
            if (so.requiredHackingSkill > player.skills.hacking / 2)
                return 0;

        return weight;
    }
}