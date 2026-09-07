import { createContext } from 'react';

export type FormBoundaryListener = {
	handleInput: (event: React.FormEvent) => void;
	handleBlur: (event: React.FocusEvent) => void;
};

export type FormBoundaryContextValue = {
	register: (listener: FormBoundaryListener) => () => void;
};

export const FormBoundaryContext =
	createContext<FormBoundaryContextValue | null>(null);
