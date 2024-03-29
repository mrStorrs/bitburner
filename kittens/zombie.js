/** @param {NS} ns */
//this is for deploying any file we want. such as chompy chomper. 
const files = ["/kittens/chomp.js", "/kittens/g.js", "/kittens/w.js", "/kittens/h.js", "/kittens/batch/gb.js", "/kittens/batch/hb.js", "/kittens/batch/wb.js", "/kittens/batch/prep.js", "/bit/prep.js"]

export async function main(ns) {
    let servers = ns.read("/lib/servers.js").split("%")
    let printedNodes = ["home"];
    ns.tail();

    for (let server of servers) {
        let nodes = server.split(",");
        for (let i = 1; i < nodes.length; i++) {
            let node = nodes[i];
            if (!printedNodes.includes(node)) {
                ns.scp(files, node, "home")
                ns.print("files added to: " + node)
                printedNodes.push(node);
                // await ns.sleep(50); //this happens to be the perfect amount for visualztion
                await ns.sleep(50);
            }
        }
    }
}