import { checkStateTests } from './checkState.js';
import { exactMeetTests } from './exactMeet.js';

const run = () => {
    exactMeetTests();
    checkStateTests();
};

run();
