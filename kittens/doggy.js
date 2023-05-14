/**
 * Basic server buying script will buy the max amount of servers with pecified ram that you set. 
 */
/** @param {import("../.").NS} ns */
export async function main(ns) {
    ns.tail()
    let servers = ns.read("/lib/serversInd.js").split(",")

    for (let server of servers) {
        // let portsReq = ns.getServerNumPortsRequired(server);
        try {
            await ns.singularity.installBackdoor(server)
        } catch {}
        // await ns.sleep(50);
    }
    
}