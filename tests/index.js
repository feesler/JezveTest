import { BrowserEnvironment } from '../src/env/BrowserEnvironment.js';
import { setupTest, TestApplication, onReady } from '../src/index.js';

class Application extends TestApplication {
    constructor() {
        super();
    }

    async init() {
        setupTest(this.environment);
    }

    async startTests() {
    }
}

const App = new Application();


onReady(() => {
    setTimeout(() => {
        const environment = new BrowserEnvironment();

        const options = {
            app: App,
            validateContent: (content) => (true),
            routeHandler: (env, url) => {
            },
            appPath: '/',
            container: document.getElementById('testscontainer'),
        };

        environment.init(options);
    });
});
