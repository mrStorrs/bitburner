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
    ns.exec("/kittens/shiny.js", "home"); //lets get those shiny shinies
    await ns.sleep(10000); //delay while scans run so that it doesn't overlap with the read. 
    const indServers = ns.read("/lib/serversInd.js").split(",")


    // let servers = ["home"] 
    //     servers = servers.concat(ns.read("/lib/serversNuked.js").split(","));

    // var bestTarget = ns.read("/lib/serversTarget.js")
    hackLevel = ns.getHackingLevel();

    
    // ns.exec("/scan/scanTarget.js", "home")

    // let bestT = getBestTarget(ns, indServers, hackLevel)
    targetServer = getTarget(ns, "home", "n00dles",  hackLevel, indServers);
    // if(hackLevel < 600) targetServer = "n00dles" 
    // else if(ns.hasRootAccess("the-hub") && ns.getServerMaxRam("hamster-23") > 4000) targetServer = "the-hub"
    // else if (hackLevel > 1800 && ns.hasRootAccess("nwo") && ns.getServerMaxRam("hamster-23") > 1000000) targetServer = "nwo";

    let servers = ["home"]
        servers = servers.concat(ns.getPurchasedServers());
    // let servers = ns.getPurchasedServers();

    var hackLevel = ns.getHackingLevel(); 
    var batchTrack = {}
    //we could create a function that only allows batches that encompass the whole money %
    //to be placed. This is only needed if there is a bottleneck of servers needing batches
    var minThreads = getMinimumThreadsReq(ns, targetServer);
    // const servers = ["home", ".hamster"]; 
    // const server = "home";
    // const targetServer = "n00dles"
    ns.tail();


    // ns.disableLog("getServerSecurityLevel")
    // ns.disableLog("getServerMoneyAvailable")
    // // ns.disableLog("getServerMaxMoney")
    // ns.disableLog("sleep")
    // ns.disableLog("getServerMaxRam")
    // ns.disableLog("getServerUsedRam")
    // ns.disableLog("getScriptRam")
    // ns.disableLog("getHackingLevel")
    // ns.disableLog("getServerMinSecurityLevel")
    // ns.disableLog("exec")
    ns.disableLog("ALL"); 

    //next step make these so that it runs a looped batch release. that way its not having to re-send new ones. 
    //will need a step to account for de-syncs. maybe something that watches for desynces then resets them if it finds one
    //or maybe a reset when times go up. 

    while (true) {
        //force a new scan every x minutes?
        for (let server of servers){
            let currHackLevel = ns.getHackingLevel();
            //first we need to prep the server
            let serverStats = getServerStats(ns, server, targetServer);//grab stats
            let threadsAvailable = Math.floor(serverStats.availableRam / hackScriptCost);
            let delays = getDelays(ns, targetServer);
            if (server == "home") Math.floor(threadsAvailable * .90);; 
            // if(batchTrack[server] != undefined && ns.isRunning("/kittens/batch/wb.js", server, targetServer, batchTrack[server], "batch")){
            //     await ns.sleep(5); 
            //     continue; 
            // }
            //could create a calculation for the minimum requried threads here. 
            let tMinThreads = minThreads;
            if(!allowLowRamBatch){
                tMinThreads = minThreads * 2
            }

            if (threadsAvailable < tMinThreads) { //cant batch with less than 4 threads. 
                await ns.sleep(1);
                continue;
            };

            if (currHackLevel > hackLevel){
                await ns.sleep(1000); // we leveld up so we want to wait so there is no desyncs.
                // If we have formulas, we can refine the weight calculation
                if (ns.fileExists('Formulas.exe')) {
                    let pl = ns.getPlayer();
                    let so = ns.getServer(server);
                    let wTimeCur = ns.formulas.hacking.weakenTime(so, pl)
                    pl.skills.hacking = hackLevel; //lower level to the past level 
                    let wTimePast = ns.formulas.hacking.weakenTime(so, pl)
                    let levelDelay = wTimePast - wTimeCur;
                    ns.tprint(levelDelay)
                    await ns.sleep(levelDelay); 
                }

                //need to reset pretpping if one of these conditions is hit. 
                hackLevel = currHackLevel; 
                targetServer = getTarget(ns, server, targetServer, hackLevel, indServers);
            }
            //add a kill all funciton that kill all runing prep steps upon reaching goal. 
            //eventually prep steps could be to only run the proper prep step items. 
            //may want to create multiple instances of prep on each box for better coverage. 
            //or stagger the prep scripts
            if (!batchingStarted && (serverStats.security > 2 || serverStats.money > 10000)) {
                let threadsAvailable = Math.floor(serverStats.availableRam / prepScriptCost);
                if (server == "home") threadsAvailable = Math.floor(threadsAvailable*.90); 
                
                initiatePrepJob(ns, threadsAvailable, server, targetServer, serverStats, delays);
                // let tThreads = Math.floor(threadsAvailable/3);
                // ns.exec("/kittens/batch/prep.js", server, threadsAvailable, targetServer, prepIdx);
                // ns.exec("/kittens/batch/gb.js", server, tThreads, targetServer, prepIdx);
                // ns.exec("/kittens/batch/wb.js", server, tThreads, targetServer, prepIdx + .1);
                isPrepping = true; 
                // ns.tprint("preppingFirst")
            //may need a security one here. but so far security has remained on lock once started. 
            //need to develop a way to fix that. 
            // } else if (batchingStarted && (serverStats.money > (serverStats.maxMoney * hackPercent + serverStats.maxMoney * .1) || serverStats.security > ns.getServerMinSecurityLevel(targetServer) + (((hackPercent / ns.hackAnalyze(targetServer)) * .002) + 1 ))){
            } else if (batchingStarted && (serverStats.money > (serverStats.maxMoney * hackPercent + serverStats.maxMoney * .1))){
                batchingStarted = false;
                let threadsAvailable = Math.floor(serverStats.availableRam / prepScriptCost);
                if (server == "home") threadsAvailable = Math.floor(threadsAvailable * .90); 
                
                initiatePrepJob(ns, threadsAvailable, server, targetServer, serverStats, delays);

                // ns.exec("/kittens/batch/prep.js", server, threadsAvailable, targetServer, prepIdx);
                isPrepping = true;  
                ns.tprint("preppingAgain")
                ns.tprint(ns.getServerSecurityLevel(targetServer));
                ns.tprint(ns.getServerMoneyAvailable(targetServer));
            } else {
                //lets start batching baby
                let threadAllocation = allocateThreads(ns, threadsAvailable, minThreads, targetServer);
                let threads = 1;
                let delay = 0;
                batchingStarted = true; 

                if(isPrepping){
                    //kill all scripts regarding prep. 
                    for(let server of servers){
                        // ns.kill("/kittens/batch/prep.js", server, targetServer); 
                        ns.killall(server, true)
                        //rerun shiny
                        if(server == "home") ns.exec("/kittens/shiny.js", "home");
                    }
                    isPrepping = false; 
                    prepIdx = 1; 
                }

                for (let i = 0; i < scripts.length; i++) {
                    let script = scripts[i];
                    switch (i) {
                        case 0:
                            delay = delays.hackDelay;
                            threads = threadAllocation.hack;
                            break;
                        case 1:
                            delay = delays.weakenDelay1;
                            threads = threadAllocation.weaken;
                            break;
                        case 2:
                            delay = delays.growDelay;
                            threads = threadAllocation.grow;
                            break;
                        case 3:
                            delay = delays.weakenDelay2;
                            threads = threadAllocation.weaken2;
                            //set our delay arg to be checked later
                            batchTrack[server] = delays.weakenDelay2
                            break;
                    }
                    if (threads == 0) continue;
                    ns.exec(script, server, threads, targetServer, delay, "batch-" + batchIdx, workerDebug);
                }
                ns.print("Starting batch: " + batchIdx + " on server: " + server);
                await ns.sleep(1); 
                batchIdx++; 
                // await ns.sleep(delays.batchDelay); //going to sleep for the last set delay which 
            }
            await ns.sleep(spacer * 5); //techincally i think this could be * 4 but this will give us some extra space. 
        }
        if(isPrepping) prepIdx++; 
    }
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
        grow = Math.ceil(ns.growthAnalyze(targetServer, maxMoney / moneyLeft)*2);
        growTotalCost = growCost * grow;

        weaken2 = Math.ceil((growTotalCost) / weakenCost)
        cycleThreads = (hack + weaken + grow + weaken2); 
        // if (growTotalCost - (weaken2 - 1) * weakenCost > weakenCost) weaken2++;
    }
    // grow = Math.ceil(grow); 

    //we estimated too many threads. use previous. 
    if((cycleThreads) > threads){
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

function getMinimumThreadsReq(ns, targetServer){
    let hackLossFactor = ns.hackAnalyze(targetServer);
    let maxMoney = ns.getServerMaxMoney(targetServer);
    let moneyLoss = maxMoney * hackLossFactor; 
    let moneyLeft = maxMoney - moneyLoss; 
    let grow = Math.ceil(ns.growthAnalyze(targetServer, maxMoney / moneyLeft));
    //1 per each weaken and hack. plus growth.

    return 3 + grow; 
}

/** @param {import("../..").NS} ns */
function getTarget(ns, callServer, currentTarget, hackLevel, indServers){
    let newTarget = currentTarget; 
    // ns.tprint(indServers);
    let bestT = getBestTarget(ns, callServer, indServers)
    // ns.tprint(bestT); 

    let hamRam = 0; 
    if(ns.getPurchasedServers().length > 24){
        hamRam = ns.getServerMaxRam("hamster-23")        
    } else {
        hamRam = 0; 
    }

    if (hackLevel > 3000 && hamRam > 500000 && stage < 3) {
        // ns.exec("/scan/scanTarget.js", "home")
        // let bestT = ns.read("/lib/serversTarget.js")
        if (currentTarget != bestT){
            if (ns.hasRootAccess(bestT) && ns.getServerMaxMoney(bestT) > ns.getServerMaxMoney(currentTarget)){
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
    } else if (hackLevel > 1000 &&  hamRam > 1000 && stage < 1  ){
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

function initiatePrepJob(ns, threadsAvailable, server, targetServer, serverStats, delays){
    let security = serverStats.security; 
    let wThreads1 = 0; 

    while(security > 0 && wThreads1 < threadsAvailable){
        wThreads1++; 
        security = security - 0.05; 
    }
    if(wThreads1 > 0) ns.exec("/kittens/batch/wb.js", server, wThreads1, targetServer, 0, "prepw-" + prepIdx, workerDebug);

    let gThreadsNeeded = 0; 
    if(serverStats.money > 0){
        gThreadsNeeded = Math.ceil(ns.growthAnalyze(targetServer, (ns.getServerMaxMoney(targetServer) / serverStats.money + 1) ));
    } 
    let gThreads = 0; 
    while (gThreads < gThreadsNeeded && wThreads1 + gThreads < threadsAvailable) {
        gThreads++;
    }
    if(gThreads > 0) ns.exec("/kittens/batch/gb.js", server, gThreads, targetServer, delays.growDelay, "prepg-" + prepIdx, workerDebug);
    let wThreads2 = threadsAvailable - gThreads - wThreads1;
    if(wThreads2 > 0){
        ns.exec("/kittens/batch/wb.js", server, wThreads2, targetServer, delays.weakenDelay2, "prepw2-" + prepIdx, workerDebug);
    }   
    return; 
}

function getBestTarget(ns, callServer, indServers){
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
    if(callServer = "home"){
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