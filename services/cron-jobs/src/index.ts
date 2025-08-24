import { NavTracker } from "./trackers/nav.tracker";
import { AssetPriceTracker } from "./trackers/asset-price.tracker";
import { BasktPerformanceTracker } from "./trackers/baskt-performance.tracker";
import { LPTracker } from "./trackers/lp.tracker";

async function main() {
    // Load all the jobs 
    const jobs = [
        // new NavTracker(),
        // new AssetPriceTracker(),
        // new BasktPerformanceTracker(),
        new LPTracker(),
    ];

    // Start all the jobs
    for (const job of jobs) {
        await job.start();
    }
}

main();