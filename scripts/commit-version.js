import * as dotenv from 'dotenv';
import { commitVersion } from '@jezvejs/release-tools';

dotenv.config();

commitVersion({
    versionFiles: [
        'tests/package.json',
        'package-lock.json',
        'package.json',
        'packages/jezve-test/package.json',
    ],
    packageName: 'jezve-test',
    gitDir: process.env.PROJECT_GIT_DIR,
    mainBranch: 'master',
});
