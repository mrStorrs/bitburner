/** @param {NS} ns 
 * This is the infector script of my zombie class. It would infect all nearby nodeds then copy
 * itself to those then do it all over again. the weakness to this was both the cost of ram, 
 * and it would not work on non-nuked servers since it relies on exec function.
*/
var files = ["/kittens/zombie.js", "/kittens/brains.js", "/kittens/fellowZombies.js", "/kittens/chomp.js"]
var scripts = ["/kittens/zombie.js", "/kittens/brains.js"]

//setting what not to infect. 

export async function main(ns) {

    let servers = ns.scan();
    ns.tprint(servers);

    //we want to make sure the initial servers get infected. 
    if (ns.getHostname() == "home") {
        ns.write("/kittens/fellowZombies.js", "", "w")
    }
    let dontInfect = ns.read("/kittens/fellowZombies.js").split(",");

    //convert the servers to be our minons muahhaha.
    await infect(ns, servers, dontInfect);
    return ns.run("/kittens/brains.js");
}


async function infect(ns, servers, dontInfect) {
    //these will be the servers we want the infected servers
    //to not infect since we are infecting them. 
    for (let server of servers) {
        //sav
        if (ns.hasRootAccess && !dontInfect.includes(server) && server != ns.getHostname()) {
            ns.tprint("we r root, starting up the brain: " + server);
            //remove old files

            ns.exec("/kittens/zombie.js", server)
        }
    }
    return;
}