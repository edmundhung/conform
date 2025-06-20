import { createContext } from 'react';
import { unstable_createGlobalFormsObserver as createGlobalFormsObserver } from '@conform-to/dom';

export const FormContext = createContext({
	observer: createGlobalFormsObserver(),
});
