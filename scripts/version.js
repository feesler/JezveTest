import { readFileSync, writeFileSync } from 'fs';

/* eslint-disable no-console */

const getPackageVersion = (fileName) => {
    const content = readFileSync(fileName);
    const json = JSON.parse(content);
    return json.version;
};

const updateFile = (fileName, ver) => {
    if (!Array.isArray(ver)) {
        throw new Error('Invalid version argument');
    }

    const content = readFileSync(fileName);
    const strContent = content.toString();

    const updatedContent = strContent.replace(
        /"version"\s*:\s*"(.*?)"/,
        `"version": "${ver.join('.')}"`,
    );

    if (strContent === updatedContent) {
        throw new Error('Version not found');
    }

    writeFileSync(fileName, updatedContent);
};

const optionsMap = {
    major: ([mjr]) => ([mjr + 1, 0, 0]),
    minor: ([mjr, mnr]) => ([mjr, mnr + 1, 0]),
    patch: ([mjr, mnr, ptc]) => ([mjr, mnr, ptc + 1]),
};

let res = 1;
const packageFile = './package.json';

try {
    const opt = (process.argv.length > 2) ? process.argv[2] : null;
    const option = opt?.toLowerCase();

    if (!option || !(option in optionsMap)) {
        throw new Error('Invalid argument. Available values: \'major\', \'minor\' and \'patch\'');
    }

    const ver = getPackageVersion(packageFile);
    const versionParts = ver.split('.').map((part) => parseInt(part, 10));
    const updateFunc = optionsMap[option];
    const updatedParts = updateFunc(versionParts);

    updateFile(packageFile, updatedParts);

    console.log('Version updated: ', ver, ' -> ', updatedParts.join('.'));

    res = 0;
} catch (e) {
    console.log('Error: ', e.message);
} finally {
    process.exit(res);
}
