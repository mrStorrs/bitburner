/** @param {NS} ns 
 * One of my first nuker scripts. 
*/
export async function main(ns) {
    let servers = ns.scan();

    ns.tprint(servers);
    for (let server of servers) {
        if (shouldNuke(ns, server)) {
            ns.tprint("nuking: " + server);
            ns.nuke(server)
        }
    }
    return true;
}

function shouldNuke(ns, server) {
    if (ns.getServerMinSecurityLevel(server) <= ns.getHackingLevel()
        && !ns.hasRootAccess(server)
        && ns.getServerNumPortsRequired(server) == 0) {
        return true;
    }
    return false;
}