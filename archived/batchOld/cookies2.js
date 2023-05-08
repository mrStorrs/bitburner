/** @param {NS} ns 
 * Batcher attempt 1
*/
var spacer = 50;
var scripts = ["/kittens/batch/hb.js", "/kittens/batch/wb.js", "/kittens/batch/gb.js", "/kittens/batch/wb.js"]
/** @param {import("../../.").NS} ns */
export async function main(ns) {
    // const servers = ns.read("/lib/serversNuked.js").split(",")
    const targetServer = ns.read("/lib/serversTarget.js")
    let servers = ["home"]
    servers = servers.concat(ns.getPurchasedServers());
    ns.tprint(servers);

    var batchTrack = {}

    // const servers = ["home", ".hamster"]; 
    // const server = "home";
    // const targetServer = "n00dles"
    ns.tail();


    while (true) {
        for (let server of servers){
            //first we need to prep the server
            let serverStats = getServerStats(ns, server, targetServer);//grab stats
            let threadsAvailable = Math.floor(serverStats.availableRam / ns.getScriptRam("/kittens/batch/gb.js"));
            if(batchTrack[server] != undefined && ns.isRunning("/kittens/batch/wb.js", server, targetServer, batchTrack[server], "batch")){
                await ns.sleep(5); 
                continue; 
            }
            if (threadsAvailable <= 4) { //cant batch with less than 4 threads. 
                await ns.sleep(5);
                continue;
            };
            if (serverStats.security > 2 || serverStats.money > 10000 ) {
                //grow/weaken at the same times
                // if(serverStats.money > 10000){
                //     let t = Math.floor(threadsAvailable / 2); 
                    ns.exec("/kittens/batch/prep.js", server, threadsAvailable, targetServer);
                // } else {
                //     ns.exec(scripts[1], server, threadsAvailable, targetServer, 0);
                // }
            } else {
                //lets start batching baby
                let threadAllocation = allocateThreads(ns, threadsAvailable, 2);
                let delays = getDelays(ns, targetServer);

                let threads = 1;
                let delay = 0;
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
                    await ns.exec(script, server, threads, targetServer, delay, "batch");
                }
                // await ns.sleep(delays.batchDelay); //going to sleep for the last set delay which 
            }
            await ns.sleep(spacer * 6); //techincally i think this could be * 4 but this will give us some extra space. 
        }
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
    }
    return serverStats;
}


function allocateThreads(ns, threads, growMult) {
    let hack = 0;
    let weaken = 1;
    let grow = 0;
    let weaken2 = 1;
    let hackCost = 0.002
    let hackTotalCost = 0
    let weakenCost = 0.05
    let growCost = 0.004
    let growTotalCost = 0;

    //could improve this to get as close to threads as possible.
    while ((hack + weaken + grow + weaken2) < threads - 5) {
        hack++;
        hackTotalCost += hackCost;
        if (hackTotalCost - (weaken - 1) * weakenCost > weakenCost) weaken++;
        grow += growMult;
        growTotalCost += growCost * growMult;
        if (growTotalCost - (weaken2 - 1) * weakenCost > weakenCost) weaken2++;
    }

    ns.tprint(hack)
    ns.tprint(weaken)
    ns.tprint(grow)
    ns.tprint(weaken2)

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
