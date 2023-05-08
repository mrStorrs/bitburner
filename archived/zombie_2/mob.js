/**
 * this mobs whatever is the best target at the time. 
 * 
 * next idea would be to pull the best target logic out and put in it's own script (maybe have this runing all times)
 * Then we are going to make a hack controller. this hack controller will do the testing of what needs to be done on 
 * a server then it will alocate the threads as needed. this will lower the per script usage and allow differant commands
 * to be run at differant times. to make this most efficient i would probably want the best target script to also be creating
 * the has root access script over and over. 
 */
export async function main(ns) {
    let servers = ns.read("/lib/serversNuked.js").split(",")
    let bestTarget = ns.read("/lib/serversTarget.js")
    ns.tail()

    ns.tprint("best target is: " + bestTarget)
    for(let server of servers){
        let threads = 0; 
        if(!server || !ns.hasRootAccess(server)) continue; // no root access skippy. 
        while (hasMemory(ns, server)) {
            threads++;
            ns.tprint(server + " has " + (ns.getServerMaxRam(server) - ns.getServerUsedRam(server)))
            if (ns.isRunning("/kittens/chomp.js", server, bestTarget)) {
                ns.kill("/kittens/chomp.js", server, bestTarget);
            }

            ns.tprint("Lets get chomping! server: " + server + " || target: " + bestTarget + " || threads: " + threads);
            ns.exec("/kittens/chomp.js", server, threads, bestTarget)
            await ns.sleep(100);
        }
    }
}

function hasMemory(ns, server) {
    let ramLeft = ns.getServerMaxRam(server) - ns.getServerUsedRam(server)
    if (ramLeft > ns.getScriptRam("/kittens/chomp.js")) return true;
    else return false;
}