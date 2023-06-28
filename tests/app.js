import { TestApplication } from 'jezve-test';
import { config } from './config.js';
import { Scenario } from './scenario/index.js';

class Application extends TestApplication {
    constructor() {
        super();

        this.config = config;
    }

    async init() {
        this.scenario = await Scenario.create(this.environment);
    }

    async startTests() {
        await this.scenario.run();
    }
}

export const App = new Application();
