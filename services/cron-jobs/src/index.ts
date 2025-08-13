import { NavTracker } from "./trackers/nav.tracker";
import { AssetPriceTracker } from "./trackers/asset-price.tracker";


async function main() {
    // Load all the jobs 
    const jobs = [
        new NavTracker(),
        new AssetPriceTracker(),
    ];

    // Start all the jobs
    for (const job of jobs) {
        await job.start();
    }
}

main();