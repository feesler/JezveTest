import { TestComponent } from 'jezve-test';

export const createTestComponent = (content) => {
    const isComponentContent = (content instanceof TestComponent);
    const component = (isComponentContent) ? content : new TestComponent();
    if (!isComponentContent) {
        component.content = content;
    }

    return component;
};

export const testCheckState = (content, expectedState, expResult) => {
    let res = true;
    let error = null;

    console.log('TestComponent.checkState()');

    const component = createTestComponent(content);

    try {
        component.checkState(expectedState);
    } catch (e) {
        res = false;
        error = e;
    }

    if (res !== expResult) {
        console.log('FAIL res: ', res, ' expResult: ', expResult);
        if (error) {
            throw error;
        }
    } else {
        console.log('OK res: ', res, ' expResult: ', expResult);
    }
};
