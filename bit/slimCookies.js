/** @param {NS} ns 
 * Batcher attempt 1
*/

var spacer = 100;
var scripts = ["/kittens/batch/hb.js", "/kittens/batch/wb.js", "/kittens/batch/gb.js", "/kittens/batch/wb.js"]
var hackPercent = 0.85
var batchIdx = 1
var prepIdx = 1;
var isPrepping = false;
var batchingStarted = false;
const hackScriptCost = 1.75;
const prepScriptCost = 2.30;
const workerDebug = false;
var stage = 0;
var targetServer = "n00dles";
var maxGrowTime = 0; 
var maxWeakTime = 0;
var maxHackTime = 0;
var prepStarted = {};

const hackCost = 0.002
const growCost = 0.004
const weakenCost = 0.05

const HACK_TIME_PORT = 2;
const WEAKEN_TIME_PORT = 3;
const GROW_TIME_PORT = 4;


// const bnHackScriptMultiplier = 0.20 //the amount that hackscripts generate due to bnMult


//items for lower cpu comp
const lowPowerMode = false;
import { getGlobal } from '/bb-vue/lib.js'
/** @param {import("./..").NS} ns */
export async function main(ns) {
    let bus = getGlobal('testBus')
    // if (!bus) {
    //     throw new Error('Run the asciichart-ui.js script first!')
    // }

    let servers = ["home"]
        servers = servers.concat(ns.getPurchasedServers()); // get just our purchased servers.      
        // servers = servers.concat(ns.read("/lib/serversNuked.js").split(","));

    // var bestTarget = ns.read("/lib/serversTarget.js")
    hackLevel = ns.getHackingLevel();

    if(ns.args[0] != undefined){
        targetServer = ns.args[0]; 
    } else {
        targetServer = ns.read("/lib/serversTarget.js")
    }

    let targetServerTemp = targetServer;
    var hackLevel = ns.getHackingLevel();

    //we could create a function that only allows batches that encompass the whole money %
    //to be placed. This is only needed if there is a bottleneck of servers needing batches
    // var minThreads = getMinimumThreadsReq(ns, targetServer);
    var minThreads = 4; //there is a fancy funciton for this. but for all i have seen this works fine. 
    if(!lowPowerMode)minThreads *= 4; 
    ns.tail();
    ns.disableLog("ALL");
    // ns.enableLog("exec")

    //next step make these so that it runs a looped batch release. that way its not having to re-send new ones. 
    //will need a step to account for de-syncs. maybe something that watches for desynces then resets them if it finds one
    //or maybe a reset when times go up. 

    //need better way to add these
    prepStarted[targetServer] = false;
    prepStarted["nwo"] = false; //secondary hardcode target for hom
    while (true) {
        // force a new scan every x minutes?
        let prepRead = ns.readPort(1);
        if(prepRead != undefined || prepRead != null){
            prepRead = prepRead.split(",");
            if (prepRead[0] == "endprep") {
                ns.tprint("prepEnded for: " + prepRead[1])
                prepStarted[prepRead[1]] = false;
            }

        }

        // if(ns.readPort(1) == "endprep") {
        //     ns.tprint("prepEnded")
        //     prepStarted = false; 
        // }
        for (let server of servers) {

            // rudimentary split hacking
            // if (server == "home" && ns.hasRootAccess("nwo")) {
            //     targetServer = "nwo"
            // } else {
            //     targetServer = targetServerTemp
            // }

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
            if (!lowPowerMode) {
                tMinThreads = minThreads * 2
            }

            if (threadsAvailable < tMinThreads) { //cant batch with less than 4 threads. 
                await ns.sleep(1);
                continue;
            };

            if (currHackLevel > hackLevel) {
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
            }
            //add a kill all funciton that kill all runing prep steps upon reaching goal. 
            //eventually prep steps could be to only run the proper prep step items. 
            //may want to create multiple instances of prep on each box for better coverage. 
            //or stagger the prep scripts
            if (!batchingStarted && !prepStarted[targetServer] && (serverStats.security > 2 || serverStats.money > 10000)) {
                let threadsAvailable = Math.floor(serverStats.availableRam / prepScriptCost);
                if (server == "home") threadsAvailable = Math.floor(threadsAvailable * .90);

                if(!lowPowerMode) initiatePrepJob(ns, threadsAvailable, server, targetServer, serverStats, delays);
                else ns.exec("/bit/prep.js",server,  threadsAvailable, targetServer, prepIdx); 
                // await ns.sleep(ns.getWeakenTime(targetServer) + spacer*4); //updat ethis to be current weakentime - fully prepped weaken

                // let tThreads = Math.floor(threadsAvailable/3);
                // ns.exec("/kittens/batch/prep.js", server, threadsAvailable, targetServer, prepIdx);
                // ns.exec("/kittens/batch/gb.js", server, tThreads, targetServer, prepIdx);
                // ns.exec("/kittens/batch/wb.js", server, tThreads, targetServer, prepIdx + .1);
                isPrepping = true;
                // ns.tprint("preppingFirst")
                //may need a security one here. but so far security has remained on lock once started. 
                //need to develop a way to fix that. 
                // } else if (batchingStarted && (serverStats.money > (serverStats.maxMoney * hackPercent + serverStats.maxMoney * .1) || serverStats.security > ns.getServerMinSecurityLevel(targetServer) + (((hackPercent / ns.hackAnalyze(targetServer)) * .002) + 1 ))){
            } else if (1 == 0 && batchingStarted && !prepStarted[targetServer] && (serverStats.money > (serverStats.maxMoney * hackPercent + serverStats.maxMoney * .1))) {
                batchingStarted = false;
                let threadsAvailable = Math.floor(serverStats.availableRam / prepScriptCost);
                if (server == "home") threadsAvailable = Math.floor(threadsAvailable * .90);

                if (!lowPowerMode) initiatePrepJob(ns, threadsAvailable, server, targetServer, serverStats, delays);
                else ns.exec("/bit/prep.js", server, threadsAvailable, targetServer, prepIdx); 
                // await ns.sleep(spacer * 5);


                // ns.exec("/kittens/batch/prep.js", server, threadsAvailable, targetServer, prepIdx);
                isPrepping = true;
                ns.tprint("preppingAgain")
                ns.tprint(ns.getServerSecurityLevel(targetServer));
                ns.tprint(ns.getServerMoneyAvailable(targetServer));
            } else if (!prepStarted[targetServer]){
                //lets start batching baby
                let threadAllocation = allocateThreads(ns, threadsAvailable, minThreads, targetServer);
                let threads = 1;
                let delay = 0;
                batchingStarted = true;

                if (isPrepping && !prepStarted[targetServer])  {
                    //kill all scripts regarding prep. 
                    for (let server of servers) {
                        // ns.kill("/kittens/batch/prep.js", server, targetServer); 
                        ns.killall(server, true)
                        //rerun shiny
                        // if (server == "home") ns.exec("/kittens/shiny.js", "home");
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
                            // batchTrack[server] = delays.weakenDelay2
                            break;
                    }
                    if (threads == 0) continue;
                    //change to regular or what?             
                    ns.exec(script, server, threads, targetServer, delay, "batch-" + batchIdx, workerDebug, 
                            (ns.getServerMaxMoney(targetServer) * hackPercent));
                }
                // ns.print("Starting batch: " + batchIdx + " on server: " + server);
                bus.emit('testEmitter', { value: "batchDeployed"});
                batchIdx++;
                // await ns.sleep(delays.batchDelay); //going to sleep for the last set delay which 
            }
            await ns.sleep(1000); //techincally i think this could be * 4 but this will give us some extra space. 
        }
        if (isPrepping) prepIdx++;
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
        try{
            grow = Math.ceil(ns.growthAnalyze(targetServer, maxMoney / moneyLeft)*1.5);
            // grow = Math.ceil((ns.growthAnalyze(targetServer, (maxMoney/bnHackScriptMultiplier) / (moneyLeft*bnHackScriptMultiplier)) / bnHackScriptMultiplier));
        } catch {grow = 1}    
        // grow = Math.ceil(((ns.growthAnalyze(targetServer, maxMoney / moneyLeft)) / bnHackScriptMultiplier) * 1.5);

        growTotalCost = growCost * grow;

        weaken2 = Math.ceil((growTotalCost) / weakenCost)
        cycleThreads = (hack + weaken + grow + weaken2);
    }

    //we estimated too many threads. use previous. 
    if ((cycleThreads) > threads) {
        hack = tempHack;
        weaken = tempWeaken;
        grow = tempGrow;
        weaken2 = tempWeaken2;
    }
    return {
        hack,
        weaken,
        grow,
        weaken2
    };
}
/** @param {import("./..").NS} ns */
function getDelays(ns, targetServer) {
    //hardcoding this to save some time
    let weakenTime = ns.getWeakenTime(targetServer);
    let growTime = ns.getGrowTime(targetServer);
    let hackTime = ns.getHackTime(targetServer);

    ns.writePort(HACK_TIME_PORT, hackTime)

    let delays = {
        hackDelay: weakenTime - spacer - hackTime,
        weakenDelay1: 0,
        growDelay: weakenTime + spacer - growTime,
        weakenDelay2: spacer * 2,
        batchDelay: weakenTime + spacer * 10
    }

    return delays;
}

/** @param {import("../..").NS} ns */
async function initiatePrepJob(ns, threadsAvailable, server, targetServer, serverStats, delays) {
    let security = serverStats.security;
    let wThreads1 = 0;
    let gThreads = 0;
    let wThreads2 = 0;

    let wThreads1Needed = Math.ceil(security / weakenCost);
    while (wThreads1 < wThreads1Needed && wThreads1 < threadsAvailable) {
        wThreads1++;
        security = security - 0.05;
    }
    if (wThreads1 > 0) ns.exec("/kittens/batch/wb.js", server, wThreads1, targetServer, 0, "prepw-" + prepIdx, workerDebug, 0);

    // let gThreadsNeeded = Math.ceil(((ns.growthAnalyze(targetServer, (ns.getServerMaxMoney(targetServer) / serverStats.money + 1))) / bnHackScriptMultiplier) * 1.5);
    // let gThreadsNeeded = Math.ceil(ns.growthAnalyze(targetServer, ((ns.getServerMaxMoney(targetServer)/ bnHackScriptMultiplier) / (serverStats.money * bnHackScriptMultiplier))) / bnHackScriptMultiplier * 1.5);
    let gThreadsNeeded = Math.ceil(ns.growthAnalyze(targetServer, (ns.getServerMaxMoney(targetServer) / serverStats.money)) * 1.2);
    while (gThreads < gThreadsNeeded && wThreads1 + gThreads < threadsAvailable) {
        gThreads++;
    }
    if (gThreads > 1) ns.exec("/kittens/batch/gb.js", server, gThreads, targetServer, delays.growDelay, "prepg-" + prepIdx, workerDebug, 0 );
    
    let growTotalCost = growCost * gThreads;
    let wThreads2Needed = Math.ceil((growTotalCost) / weakenCost)
    while(wThreads2 < wThreads2Needed && wThreads2 + gThreads + wThreads1 < threadsAvailable){
        wThreads2++;
    }
    if (wThreads2 > 0) {
        if (wThreads1 >= wThreads1Needed && gThreads >= gThreadsNeeded && wThreads2 >= wThreads2Needed) {
            ns.tprint("prepStarted on: " + server + " target: " + targetServer)
            prepStarted[targetServer] = true;
            ns.tprint(wThreads1)
            ns.tprint(gThreads)
            ns.tprint(wThreads2)
            ns.tprint(serverStats.money);
            ns.exec("/kittens/batch/wb.js", server, wThreads2, targetServer, delays.weakenDelay2, "prepw2-" + prepIdx, workerDebug, 0, true);
        } else {
            ns.exec("/kittens/batch/wb.js", server, wThreads2, targetServer, delays.weakenDelay2, "prepw2-" + prepIdx, workerDebug, 0, false);
        }
    }


    return;
}
