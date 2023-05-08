export async function main(ns) {
    ns.tail()
    let servers = ns.read("/lib/servers.js").split("%")
    let usedNodes = [];


    for (let server of servers) {
        let nodes = server.split(",");
        for (let i = 1; i < nodes.length; i++) {
            let node = nodes[i];
            if (!usedNodes.includes(node)) {
                // let portsReq = ns.getServerNumPortsRequired(node);

                if (ns.hasRootAccess(node)) {
                    await runChomp(ns, node);
                }
                usedNodes.push(node);
            }
        }
    }
}

async function runChomp(ns, node) {
    let servers = ns.scan(node);
    let threads = 0;
    let i = 0;

    if (servers.length == 0) return; //no servers

    let bestTarget = servers[0]
    let highestWeight = 0; 
    for(let server of servers){
        let w = weight(ns, server);
        if(w > highestWeight){
            highestWeight = w;
            bestTarget = server; 
        }
    }
    ns.tprint(node + "'s best target is: " + bestTarget)

    while ((hasMemory(ns, node) && bestTarget != "home")) {
        threads++; 
        ns.tprint(node + " has " + (ns.getServerMaxRam(node) - ns.getServerUsedRam(node)))
        if (ns.isRunning("/kittens/chomp.js", node, bestTarget)) {
            ns.kill("/kittens/chomp.js", node, bestTarget);
        }

        ns.tprint("Lets get chomping! node: " + node + " || target: " + bestTarget + " || threads: " + threads);
        ns.exec("/kittens/chomp.js", node, threads, bestTarget)
        await ns.sleep(100);
        // run a check to see if we have left over memory 
        // if (hasMemory(ns, node) && n != "home") {
        //     threads++;
        //     i = 0;
        //     reset = true;
        // } else {
        //     break;
        // }
        // if (!reset) i++;
    }
    return true;
}

function hasMemory(ns, node) {
    let ramLeft = ns.getServerMaxRam(node) - ns.getServerUsedRam(node)
    if (ramLeft > ns.getScriptRam("/kittens/chomp.js")) return true;
    else return false;
}

function weight(ns, server) {
    if(server == "home") return 0; // we don't want to target ourselves. 
    if(!ns.hasRootAccess) return 0; // no root access this server sucks.
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