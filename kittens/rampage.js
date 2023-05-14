/**
 * This was designed to check all servers, then see if there is any we can crack
 * if there is... crack em baby. 
 */
// const numPrograms = 5;
export async function main(ns) {
    ns.tail()
    let servers = ns.read("/lib/serversInd.js").split(",")

    for (let server of servers) {
        // let portsReq = ns.getServerNumPortsRequired(server);
        if (!ns.hasRootAccess(server)) {
            ns.print("cracking: " + server + " || ports: " + ns.getServerNumPortsRequired(server))
            try { await ns.brutessh(server);  } catch {}
            try { await ns.ftpcrack(server);  } catch {}
            try { await ns.sqlinject(server); } catch {}
            try { await ns.httpworm(server);  } catch {}
            try { await ns.relaysmtp(server); } catch {}
            try { await ns.nuke(server);      } catch { ns.print("cracking failed") }
        }
        // await ns.sleep(50);
    }

    // if(ns.getPurchasedServers().length > 24){
    //     ns.kill("/kittens/batch/cookies.js")
    await ns.sleep(100);
    ns.run("/scan/scanNuked.js")
    // }


}