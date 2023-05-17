
var solution;
/** @param {import("../../..").NS} ns */
export async function main(ns) {
    ns.tail();
    // ns.codingcontract.createDummyContract("Array Jumping Game");
    // ns.codingcontract.attempt(maxSubArraySum(ns.codingcontract.getData("contract-827671.cct")), "contract-827671.cct")
    const servers = await ns.read("/lib/serversInd.js").split(",");

    for (let server of servers) {
        let contracts = ns.ls(server, ".cct")

        if (contracts.lengh == 0) continue;
        for (let contract of contracts) {
            let data = await ns.codingcontract.getData(contract, server);
            let type = await ns.codingcontract.getContractType(contract, server)

            ns.tprint("Located: " + type + ", contract on: " + server);

            switch (type) {
                case "Find Largest Prime Factor":
                    solution = findLargestPrimeFactor(data);
                    break;
                case "Subarray with Maximum Sum":
                    solution = maxSubArraySum(data);
                    break;
                case "Array Jumping Game":
                    solution = canJump(data);
                    break;
                default:
                    solution = null;
            }

            if (solution != null) {
                ns.tprint("Solving: " + type + ", contract on: " + server);
                await ns.codingcontract.attempt(solution, contract, server);
            }
        }
    }

}

function findLargestPrimeFactor(num) {
    let factor = 2;
    while (factor <= num) {
        if (num % factor === 0) {
            num = num / factor;
        } else {
            factor++;
        }
    }
    return factor;
}

function maxSubArraySum(nums) {
    let maxSum = nums[0];
    let currentSum = nums[0];

    for (let i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }

    return maxSum;
}


function canJump(nums) {
    if (nums[0] == 0) return 0;
    if (nums[0] >= nums.length) return 1;

    let maxReachableIndex = nums[0];

    for (let i = 0; i <= maxReachableIndex; i++) {
        let currentNum = nums[i];
        if (currentNum + i > maxReachableIndex) maxReachableIndex = currentNum + i;
        if (maxReachableIndex >= nums.length) return 1;
    }
    return 0;
}