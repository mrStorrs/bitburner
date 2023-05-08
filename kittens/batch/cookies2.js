/** @param {NS} ns 
 * Batcher attempt 1
*/

//todo:
// - need to add scan..rampage..infect stage
// - need to automate buying tor router and purchase from darkweb
// - add run command for shiny
var spacer = 20;
var scripts = ["/kittens/batch/hb.js", "/kittens/batch/wb.js", "/kittens/batch/gb.js", "/kittens/batch/wb.js"]
//make this dynamically change based on how much ram
//purchased servers have. this could be done by determinging how much ram
//it takes to do 
var hackPercent = .50
var batchIdx = 1
var prepIdx = 1; 
var isPrepping = false; 
var allowLowRamBatch = false; 
var batchingStarted = false; 
const hackScriptCost = 1.75;
const prepScriptCost = 2.30;
const workerDebug = false; 
/** @param {import("../../..").NS} ns */
export async function main(ns) {
    // ns.exec("/kittens/shiny.js", "home"); //lets get those shiny shinies

    // let servers = ["home"] 
    //     servers = servers.concat(ns.read("/lib/serversNuked.js").split(","));

    // var targetServer = ns.read("/lib/serversTarget.js")
    hackLevel = ns.getHackingLevel();

    //temp. 
    var targetServer = "n00dles";
    targetServer = getTarget(ns, targetServer, hackLevel);
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
            let threadsAvailable = Math.floor((serverStats.availableRam/2) / hackScriptCost);
            if(server == "home" ) threadsAvailable = threadsAvailable - 20; 
            // if(batchTrack[server] != undefined && ns.isRunning("/kittens/batch/wb.js", server, targetServer, batchTrack[server], "batch")){
            //     await ns.sleep(5); 
            //     continue; 
            // }
            //could create a calculation for the minimum requried threads here. 
            let tMinThreads = minThreads;
            if(!allowLowRamBatch){
                tMinThreads = minThreads * 2
            }

            if (threadsAvailable <= tMinThreads) { //cant batch with less than 4 threads. 
                await ns.sleep(1);
                continue;
            };

            if (currHackLevel > hackLevel){
                await ns.sleep(1000); // we leveld up so we want to wait so there is no desyncs.
                hackLevel = currHackLevel; 
                minThreads = getMinimumThreadsReq(ns, targetServer); 
                if (servers.length < 26 && hackLevel > 50) exec("/kittens/scan.js", "home") 
                // if(hackLevel == 500){
                //     ns.spawn("/scan/scan.js")
                // } 

                //need to reset pretpping if one of these conditions is hit. 
                targetServer = getTarget(ns, targetServer, hackLevel)
            }
            //add a kill all funciton that kill all runing prep steps upon reaching goal. 
            //eventually prep steps could be to only run the proper prep step items. 
            //may want to create multiple instances of prep on each box for better coverage. 
            //or stagger the prep scripts
            if (!batchingStarted && (serverStats.security > 2 || serverStats.money > 10000)) {
                let threadsAvailable = Math.floor(serverStats.availableRam / prepScriptCost);
                if (server == "home") threadsAvailable = Math.floor(threadsAvailable*.90); 
                
                // let tThreads = Math.floor(threadsAvailable/3);
                ns.exec("/kittens/batch/prep.js", server, threadsAvailable, targetServer, prepIdx);
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
                if (server == "home") threadsAvailable = Math.floor(threadsAvailable*.90; 
                ns.exec("/kittens/batch/prep.js", server, threadsAvailable, targetServer, prepIdx);
                isPrepping = true;  
                ns.tprint("preppingAgain")
                ns.tprint(ns.getServerSecurityLevel(targetServer));
                ns.tprint(ns.getServerMoneyAvailable(targetServer));
            } else {
                //lets start batching baby
                let threadAllocation = allocateThreads(ns, threadsAvailable, minThreads, targetServer);
                let delays = getDelays(ns, targetServer);
                let threads = 1;
                let delay = 0;
                batchingStarted = true; 

                if(isPrepping){
                    //kill all scripts regarding prep. 
                    for(let server of servers){
                        // ns.kill("/kittens/batch/prep.js", server, targetServer); 
                        // ns.killall(server, true)
                        //rerun shiny
                        // if(server == "home") ns.exec("/kittens/shiny.js", "home");
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
                batchIdx++; 
                // await ns.sleep(delays.batchDelay); //going to sleep for the last set delay which 
            }
            await ns.sleep(spacer * 4.05); //techincally i think this could be * 4 but this will give us some extra space. 
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

        grow = Math.ceil(ns.growthAnalyze(targetServer, maxMoney / moneyLeft)*1.2);
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

function getTarget(ns, currentTarget, hackLevel){
    let newTarget = currentTarget; 
    let hamRam = ns.getServerMaxRam("hamster-23")
    if (hackLevel > 600 && ns.hasRootAccess("rho-construction") && hamRam > 4000){
        newTarget = "rho-construction";
        if(hamRam){
            hackPercent = 0.95
        }
    } 
    if (hackLevel > 1800 && ns.hasRootAccess("nwo") && hamRam > 1000000) newTarget = "nwo";

    if(newTarget != currentTarget){
        batchingStarted = false; //need to reset this so proper prepping happens
    }
    return newTarget; 
}