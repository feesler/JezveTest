/**
 * Test story
 * Runs group of tests
 */
export class TestStory {
    static async run() {
        const instance = new this();
        await instance.beforeRun();
        await instance.run();
        await instance.afterRun();
    }

    /* eslint-disable no-empty-function */
    async beforeRun() {
    }

    async run() {
    }

    async afterRun() {
    }
}
