import { createContext } from 'react';
import { createGlobalFormsObserver } from '@conform-to/dom/future';

export const FormContext = createContext({
	observer: createGlobalFormsObserver(),
});
