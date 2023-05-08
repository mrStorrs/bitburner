/** @param {NS} ns */
/**
 * This function was part of the zombie funciton that would dish out the chomp virus
 * could be improved by using spawn to call the chomp so that the memory was not taken up .
 */
export async function main(ns) {
    // Defines the "target server", which is the server
    // that we're going to hack. In this case, it's "n00dles"
    const targets = ns.scan();
    ns.tprint(targets);

    while (ns.isRunning("kittens/zombies.js", ns.getHostname())) {
        ns.sleep(1000);
    }

    for (let target of targets) {
        if (ns.getServerUsedRam(target) < ns.getServerMaxRam(target) - ns.getScriptRam("kittens/brains.js")
            && !ns.isRunning("kittens/brains.js", ns.getHostname(), target)
            && ns.hasRootAccess(target)
            && target != "home") {
            ns.run("/kittens/chomp.js", 1, target);
            ns.tail("/kittens/chomp.js", target, 1, target);
        }
    }
    return;
}