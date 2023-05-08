const serversIndFile = "/lib/serversInd.js"
const serverTargetFile = "/lib/serversTarget.js"

export async function main(ns) {
    let servers = ns.read(serversIndFile).split(",")
    let bestTarget = "n00dles"
    let highestWeight = 0;
    ns.tail(); 

    //find best target. 
    for (let server of servers) {
        if (!server) continue;
        if (server == "home") continue; // we don't want to target ourselves. 
        ns.getServerMaxMoney(server) //just want to see how much mula on this thing
        let w = weight(ns, server);
        if (w > highestWeight) {
            highestWeight = w;
            bestTarget = server;
            ns.print("new best target: " + bestTarget)
        }
        // await ns.sleep(5);
    }
    ns.print("best target is: " + bestTarget)
    ns.write(serverTargetFile, bestTarget, "w")
    ns.run("/kittens/rampage.js")
}

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