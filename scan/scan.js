/** @param {NS} ns 
 * Simple scanner program that will scan all servers and then save
 * it to the spefied servers file. 
 * 
 * todo: make this so it only overwrites if new info is found. then we can pare it down to be a shorter time between. 
*/
var scannedServers = ["home"];
var serversFile = "/lib/servers.js"

export async function main(ns) {
    ns.tail();
    let localServers = ns.scan("home")
    ns.write(serversFile, "", "w") //reset docu
    ns.write(serversFile, "home," + ns.scan("home") + "%", "a") //add initial connections

    // ns.tprint(ns.scan("nectar-net"));
    scanServers(ns, localServers);

    // ns.tprint(ns.read("/kittens/scanner.js"));
    let orgServers = ns.read(serversFile).split("%")
    for (let orgServer of orgServers) {
        ns.print(orgServer);
    }
    await ns.sleep(50);
    ns.run("/scan/scanInd.js")
}

async function scanServers(ns, localServers) {
    if (localServers.length > 0) {
        for (let server of localServers) {
            // ns.write("/kittens/scanner.js", server + "," , "a") //add server 

            if (!scannedServers.includes(server)) {
                ns.write(serversFile, server + "," + ns.scan(server) + "%", "a") //add server 
                scannedServers.push(server);
                scanServers(ns, ns.scan(server))
            }
        }
    }
}