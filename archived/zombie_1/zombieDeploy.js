/** @param {NS} ns 
 * this function was similar to zombie but was designed only to deploy scripts. 
 * has same problems as the other. 
*/
var files = ["/kittens/zombie.js", "/kittens/brains.js", "/kittens/fellowZombies.js", "/kittens/chomp.js", "/kittens/zombieDeploy.js"]
var scripts = ["/kittens/zombie.js", "/kittens/brains.js"]

//setting what not to infect. 

export async function main(ns) {

    let servers = ns.scan();
    ns.tprint("host: " + ns.getHostname() + " || nodes: " + servers);

    //we want to make sure the initial servers get infected. 
    if (ns.getHostname() == "home") {
        ns.write("/kittens/fellowZombies.js", "", "w")
    }
    let dontInfect = ns.read("/kittens/fellowZombies.js").split(",");



    //check for nukable servers. then nuke them baby. 
    await nuke(ns, servers);

    //convert the servers to be our minons muahhaha.
    await infect(ns, servers, dontInfect);
    return;
}

async function nuke(ns, servers) {
    for (let server of servers) {
        if (shouldNuke(ns, server)) {
            ns.tprint("nuking: " + server);
            ns.nuke(server)
        }
    }
    return true;
}

async function infect(ns, servers, dontInfect) {
    //these will be the servers we want the infected servers
    //to not infect since we are infecting them. 
    ns.write("/kittens/fellowZombies.js", servers.toString(), "w");
    ns.tail("/kittens/zombieDeploy.js")

    for (let server of servers) {		    //sav
        if (!dontInfect.includes(server) && server != ns.getHostname()) {
            if (ns.hasRootAccess) {
                ns.tprint("we are NOT root: " + server)
            } else {
                ns.tprint("we are root: " + server)
            }
            // ns.tprint("files deployed: " + server);
            //remove old files
            // for (let file of scripts){
            // 	ns.rm(file, server);
            // }
            //re add new ones. 
            ns.scp(files, server, ns.getHostname())

            ns.exec("/kittens/zombieDeploy.js", server)
            await ns.sleep(500);
            // ns.tail("/kittens/zombieDeploy.js", server)
        }
    }
    return;
}

function shouldNuke(ns, server) {
    if (!ns.hasRootAccess(server)
        && ns.getServerNumPortsRequired(server) == 0) {
        return true;
    }
    return false;
}