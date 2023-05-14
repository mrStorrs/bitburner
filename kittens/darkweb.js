/**
 * Basic server buying script will buy the max amount of servers with pecified ram that you set. 
 */
/** @param {import("../.").NS} ns */
export async function main(ns) {
    ns.tail()
    ns.singularity.purchaseTor()
    ns.singularity.purchaseProgram("brutessh.exe");
    ns.singularity.purchaseProgram("ftpcrack.exe");
    ns.singularity.purchaseProgram("relaysmtp.exe");
    ns.singularity.purchaseProgram("httpworm.exe");
    ns.singularity.purchaseProgram("sqlinject.exe");
    ns.singularity.purchaseProgram("deepscanv2.exe");
    // purchaseProgram("brutessh.exe");
    // purchaseProgram("brutessh.exe");
    // purchaseProgram("brutessh.exe");
}