export async function main(ns) {
    ns.tail()
    let servers = ns.read("/lib/servers.js").split("%")
    let usedNodes = [];


    for (let server of servers) {
        let nodes = server.split(",");
        for (let i = 1; i < nodes.length; i++) {
            let node = nodes[i];
            if (!usedNodes.includes(node)) {
                // let portsReq = ns.getServerNumPortsRequired(node);

                if (ns.hasRootAccess(node)) {
                    await runChomp(ns, node);
                }
                usedNodes.push(node);
            }
        }
    }
}

async function runChomp(ns, node) {
    let servers = ns.scan(node);
    let threads = 1;
    let i = 0;

    if (servers.length == 0) return; //no servers

    while (i < servers.length) {
        let n = servers[i];
        let reset = false;
        if (hasMemory(ns, node) && n != "home") {
            if (ns.isRunning("/kittens/chomp.js", node, n)) {
                ns.kill("/kittens/chomp.js", node, n);
            }

            if (ns.hasRootAccess(n)) {
                ns.tprint("Lets get chomping! node: " + node + " || target: " + n + " || threads: " + threads);
                ns.exec("/kittens/chomp.js", node, threads, n)
            }
            await ns.sleep(100);
        }
        // run a check to see if we have left over memory 
        if (i == servers.length - 1) {
            if (hasMemory(ns, node) && n != "home") {
                ns.tprint(node + " has " + (ns.getServerMaxRam(node) - ns.getServerUsedRam(node)))
                threads++;
                i = 0;
                reset = true;
            } else {
                break;
            }
        }
        if (!reset) i++;
    }
    return true;
}

function hasMemory(ns, node) {
    let ramLeft = ns.getServerMaxRam(node) - ns.getServerUsedRam(node)
    if (ramLeft > ns.getScriptRam("/kittens/chomp.js")) return true;
    else return false;
}