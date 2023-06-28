/**
 * Test story
 * Runs group of tests
 */
export class TestStory {
    static async run() {
        const instance = new this();
        await instance.beforeRun();

        try {
            await instance.run();
        } catch (e) {
            await instance.afterRun();
            throw e;
        }

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
