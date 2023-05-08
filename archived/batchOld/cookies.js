/** @param {NS} ns 
 * Batcher attempt 1
*/
var spacer = 50;
var scripts = ["/kittens/batch/hb.js", "/kittens/batch/wb.js", "/kittens/batch/gb.js", "/kittens/batch/wb.js"]

export async function main(ns) {
    // const servers = ns.read("/lib/serversNuked.js").split(",")
    // const targetServer = ns.read("/lib/serversTarget.js")
    const server = "home";
    const targetServer = "n00dles"
    ns.tail();

    while (true) {
        //first we need to prep the server
        let serverStats = getServerStats(ns, server,  targetServer);//grab stats
        let threadsAvailable = Math.floor(serverStats.availableRam / ns.getScriptRam("/kittens/batch/gb.js"));
        ns.tprint(serverStats.money);
        ns.tprint(serverStats.securitydddkas``);
        if (threadsAvailable == 0) {
            await ns.sleep(5); 
            continue; 
        }; 
        if (serverStats.security >  2) {
            ns.exec(scripts[1], server, threadsAvailable, targetServer, 0);
            ns.tprint("weakening")
            //weaken
        } else if (serverStats.money > 10000) {
            ns.exec(scripts[2], server, threadsAvailable, targetServer, 0);
            ns.tprint("growing")

            //grow
        } else {
            //lets start batching baby
            let threadAllocation = allocateThreads(ns, threadsAvailable, 1);
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
                        break;
                }
                if(threads == 0) continue; 
                await ns.exec(script, server, threads, targetServer, delay, i);
            }
            await ns.sleep(delays.batchDelay); //going to sleep for the last set delay which 
        }
        await ns.sleep(5);
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
    while ((hack + weaken + grow + weaken2) < threads - 5){
        hack++; 
        hackTotalCost += hackCost;
        if(hackTotalCost - (weaken-1)*weakenCost > weakenCost ) weaken++;
        grow += growMult;
        growTotalCost += growCost*growMult;
        if(growTotalCost - (weaken2-1)*weakenCost > weakenCost) weaken2++; 
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
