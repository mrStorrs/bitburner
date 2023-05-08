const serversIndFile = "/lib/serversInd.js"
const serversNukedFile = "/lib/serversNuked.js"
export async function main(ns) {
    let servers = ns.read(serversIndFile).split(",")
    ns.write(serversNukedFile, "home", "w")
    ns.tail();

    //find best target. 
    for (let server of servers) {
        if (!server || server == "home") continue;
        if(ns.hasRootAccess(server)){
            ns.write(serversNukedFile, "," + server, "a")
            ns.print("found nuked server: " + server); 
            // await ns.sleep(5);

        }
    }   
    ns.run("/scan/scanTarget.js")
}