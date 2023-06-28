import { setBlock } from 'jezve-test';
import { testCheckState, createTestComponent } from '../actions/checkState.js';

/**
 * TestComponent.checkState() method tests
 */
export const checkStateTests = async () => {
    setBlock('TestComponent.checkState() method', 1);

    await testCheckState(
        {
            item1: createTestComponent({
                title: 'Item 1',
                children: [
                    { id: 'child_1', title: 'Child item 1' },
                    createTestComponent({ id: 'child_2', title: 'Child item 2' }),
                ],
            }),
        },
        {
            item1: {
                title: 'Item 1',
                children: [
                    { id: 'child_1', title: 'Child item 1' },
                    { id: 'child_2', title: 'Child item 2' },
                ],
            },
        },
        true,
    );
};
