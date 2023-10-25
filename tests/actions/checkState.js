import { TestComponent, test } from 'jezve-test';
import { assert } from '@jezvejs/assert';

export const createTestComponent = (content) => {
    const isComponentContent = (content instanceof TestComponent);
    const component = (isComponentContent) ? content : new TestComponent();
    if (!isComponentContent) {
        component.content = content;
    }

    return component;
};

export const testCheckState = async (content, expectedState, expResult) => {
    await test('TestComponent.checkState() method', () => {
        let res = true;
        const component = createTestComponent(content);

        try {
            component.checkState(expectedState);
        } catch (e) {
            res = false;
            if (expResult) {
                throw e;
            }
        }

        assert.equal(res, expResult, `Not expected result ${res}`);

        return true;
    });
};
