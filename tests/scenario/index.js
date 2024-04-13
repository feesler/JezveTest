import {
    Runner,
    setBlock,
    getSelectedStory,
} from 'jezve-test';
import { assert } from '@jezvejs/assert';
import { checkStateTests } from './checkState.js';

const storiesMap = {
    checkState: checkStateTests,
};

export class Scenario {
    constructor(environment) {
        this.environment = environment;
    }

    static async create(environment) {
        const instance = new this(environment);
        await instance.init();
        return instance;
    }

    async init() {
        // Setup test runner
        this.runner = new Runner();
    }

    async run() {
        const stories = getSelectedStory();
        if (stories.length > 0) {
            for (const story of stories) {
                if (!this.checkSelectedStory(story)) {
                    return;
                }

                setBlock(`Running '${story}' test story`, 1);
                await this.runStory(story);
            }
        } else {
            await this.runFullScenario();
        }
    }

    /* eslint-disable no-console */
    checkSelectedStory(story) {
        if (typeof story !== 'string') {
            return false;
        }
        if (story in storiesMap) {
            return true;
        }

        console.log(`Invalid story name: ${story}`);
        console.log('Available test stories:');
        const storyNames = this.getStorieNames();
        storyNames.forEach((name) => console.log(`  ${name}`));

        return false;
    }
    /* eslint-enable no-console */

    getStory(name) {
        assert(name in storiesMap, `Invalid story name: ${name}`);

        return storiesMap[name];
    }

    getStorieNames() {
        return Object.keys(storiesMap);
    }

    async runStory(name) {
        const story = this.getStory(name);
        await story();
    }

    async runFullScenario() {
        setBlock('Running full test scenario', 1);

        const stories = this.getStorieNames();
        for (const story of stories) {
            await this.runStory(story);
        }
    }
}
