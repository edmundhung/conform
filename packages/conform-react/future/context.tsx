import { createContext } from 'react';
import { createGlobalFormsObserver } from '@conform-to/dom/future';

export const Context = createContext({
	observer: createGlobalFormsObserver(),
});
