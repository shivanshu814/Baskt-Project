// A Job is a function which is run on a schedule 

import { Querier } from "@baskt/querier/";

 export abstract class BaseJob {
    constructor(
        private readonly name: string,
        private readonly scheduleSeconds: number,
    ) {}

    abstract run(): Promise<void>;

    async start(): Promise<void> {
        setInterval(async () => {
            await this.run();
        }, this.scheduleSeconds * 1000);
    }
}