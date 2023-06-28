import { environment } from 'jezve-test/NodeEnvironment';
import { onReady } from 'jezve-test';

import { App } from './app.js';

const isBrowser = typeof window !== 'undefined';
const options = {
    app: App,
    validateContent: () => (true),
    routeHandler: () => { },
    appPath: '/',
};

const run = async () => {
    if (isBrowser) {
        const { origin } = window.location;
        if (origin.includes('localtest')) {
            options.appPath = '/tests/dist/';
        }

        options.container = document.getElementById('testscontainer');
    }

    environment.init(options);
};

if (isBrowser) {
    onReady(() => run());
} else {
    run();
}
