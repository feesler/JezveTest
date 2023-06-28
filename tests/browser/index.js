import { BrowserEnvironment } from '../src/env/BrowserEnvironment.js';
import { TestApplication, onReady } from '../src/index.js';

class Application extends TestApplication {
    async init() {
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
            validateContent: () => (true),
            routeHandler: () => {},
            appPath: '/',
            container: document.getElementById('testscontainer'),
        };

        environment.init(options);
    });
});
