// A Job is a function which is run on a schedule 

import { Querier } from "@baskt/querier/";
import { querierClient } from "./config/client";

 export abstract class BaseJob {
    private querierClient: Querier;
    constructor(
        private readonly name: string,
        private readonly scheduleSeconds: number,
    ) {
        this.querierClient = querierClient;
        this.querierClient.init();
    }

    abstract run(): Promise<void>;

    async start(): Promise<void> {
        this.run();
        setInterval(async () => {
            await this.run();
        }, this.scheduleSeconds * 1000);
    }
}