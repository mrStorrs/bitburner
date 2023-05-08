/**
 * Basic server buying script will buy the max amount of servers with pecified ram that you set. 
 */
/** @param {import("../.").NS} ns */
export async function main(ns) {
    let ram = 64
    let maxServers = 25
    let name = "hamster"
    for (let i = 0; i < maxServers; i++) {
        ns.purchaseServer(name, ram);
    } 
}