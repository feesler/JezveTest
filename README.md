# JezveTest
Testing utility written from scratch.

Support in-browser and Node.js(via puppeteer) environments for tests.

<h2 align="center">Install</h2>

```bash
npm install -D jezve-test
```

<h2 align="center">Usage</h2>

Write your tests scenario using provided interface.
- Class `TestApplication` store session data of application between navigations.
  Inherit from TestApplication and implement your own handling of state.
- Class `TestView` provides common interface for parsing page and perform further actions on it.
- `TestComponent` class is designed to easily break view onto reusable parts

