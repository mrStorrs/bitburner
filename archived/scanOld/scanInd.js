/** @param {NS} ns 
 * Simple scanner program that will scan all servers and then save
 * it to the spefied servers file. 
*/
var serversFile = "/lib/servers.js"
var serversIndFile = "/lib/serversInd.js"

export async function main(ns) {
    ns.write(serversIndFile, "home", "w") //clear serversInd for fresh run. 
    let servers = ns.read(serversFile).split("%")
    let printedNodes = ["home"];
    ns.tail();
    ns.disableLog("sleep")

    for (let server of servers) {
        let nodes = server.split(",");
        // ns.tprint(nodes);
        for (let i = 1; i < nodes.length; i++) {
            await ns.sleep(5);
            let node = nodes[i];
            if (!printedNodes.includes(node)) {
                ns.write(serversIndFile, "," + node, "a") //add initial connections
                ns.print(node);
                printedNodes.push(node);
            }
        }
    }
}