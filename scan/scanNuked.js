const serversIndFile = "/lib/serversInd.js"
const serversNukedFile = "/lib/serversNuked.js"
export async function main(ns) {
    let servers = ns.read(serversIndFile).split(",")
    await ns.write(serversNukedFile, "home", "w")
    ns.tail();

    //find best target. 
    for (let server of servers) {
        if (!server || server == "home") continue;
        if(ns.hasRootAccess(server)){
            await ns.sleep(50)
            ns.write(serversNukedFile, "," + server, "a")
            ns.print("found nuked server: " + server); 
            // await ns.sleep(5);

        }
    }   
    await ns.sleep(100)
    ns.run("/scan/scanTarget.js")
}