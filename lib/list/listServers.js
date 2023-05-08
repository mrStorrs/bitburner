/** @param {NS} ns 
 * simply list out the servers. 
*/
var serversFile = "/lib/servers.js"
export async function main(ns) {
    ns.tail();
    let orgServers = ns.read(serversFile).split("%")


    for (let orgServer of orgServers) {
        ns.tprint(orgServer);
    }
}
