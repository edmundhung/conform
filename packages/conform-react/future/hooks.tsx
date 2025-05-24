import {
	createGlobalFormsObserver,
	deepEqual,
	focus,
	change,
	blur,
	isFieldElement,
} from '@conform-to/dom';
import { useEffect, useRef, useSyncExternalStore, useCallback } from 'react';
import {
	focusable,
	getCheckboxGroupValue,
	getDefaultSnapshot,
	getInputSnapshot,
	getRadioGroupValue,
	initializeField,
} from './util';

export const formObserver = createGlobalFormsObserver();

export type Control = {
	value: string | undefined;
	checked: boolean | undefined;
	options: string[] | undefined;
	files: File[] | undefined;
	register: (
		element:
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLCollectionOf<HTMLInputElement>
			| NodeListOf<HTMLInputElement>
			| null
			| undefined,
	) => void;
	change(value: string | string[] | boolean | File | File[] | FileList): void;
	focus(): void;
	blur(): void;
};

export function useControl(options?: {
	defaultValue?: string | string[] | File | File[] | null | undefined;
	defaultChecked?: boolean | undefined;
	value?: string;
	onFocus?: () => void;
}): Control {
	const inputRef = useRef<
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| Array<HTMLInputElement>
		| null
	>(null);
	const eventDispatched = useRef<{
		change?: number;
		focus?: number;
		blur?: number;
	}>({});

	const defaultSnapshot = getDefaultSnapshot(
		options?.defaultValue,
		options?.defaultChecked,
		options?.value,
	);
	const snapshotRef = useRef(defaultSnapshot);
	const optionsRef = useRef(options);

	useEffect(() => {
		optionsRef.current = options;
	});

	// This is necessary to ensure that input is re-registered
	// if the onFocus handler changes
	const shouldHandleFocus = typeof options?.onFocus === 'function';
	const snapshot = useSyncExternalStore(
		useCallback(
			(callback) =>
				formObserver.onFieldUpdate((event) => {
					const input = event.target;

					if (
						Array.isArray(inputRef.current)
							? inputRef.current.some((item) => item === input)
							: inputRef.current === input
					) {
						callback();
					}
				}),
			[],
		),
		() => {
			const input = inputRef.current;
			const prev = snapshotRef.current;
			const next = !input
				? defaultSnapshot
				: Array.isArray(input)
					? {
							value: getRadioGroupValue(input),
							options: getCheckboxGroupValue(input),
						}
					: getInputSnapshot(input);

			if (deepEqual(prev, next)) {
				return prev;
			}

			snapshotRef.current = next;
			return next;
		},
		() => snapshotRef.current,
	);

	useEffect(() => {
		const createEventListener = (listener: 'change' | 'focus' | 'blur') => {
			return (event: Event) => {
				if (
					Array.isArray(inputRef.current)
						? inputRef.current.some((item) => item === event.target)
						: inputRef.current === event.target
				) {
					const timer = eventDispatched.current[listener];

					if (timer) {
						clearTimeout(timer);
					}

					eventDispatched.current[listener] = window.setTimeout(() => {
						eventDispatched.current[listener] = undefined;
					});

					if (listener === 'focus') {
						optionsRef.current?.onFocus?.();
					}
				}
			};
		};
		const inputHandler = createEventListener('change');
		const focusHandler = createEventListener('focus');
		const blurHandler = createEventListener('blur');

		document.addEventListener('input', inputHandler, true);
		document.addEventListener('focusin', focusHandler, true);
		document.addEventListener('focusout', blurHandler, true);

		return () => {
			document.removeEventListener('input', inputHandler, true);
			document.removeEventListener('focusin', focusHandler, true);
			document.removeEventListener('focusout', blurHandler, true);
		};
	}, []);

	return {
		value: snapshot.value,
		checked: snapshot.checked,
		options: snapshot.options,
		files: snapshot.files,
		register: useCallback(
			(element) => {
				if (!element) {
					inputRef.current = null;
				} else if (isFieldElement(element)) {
					inputRef.current = element;

					if (shouldHandleFocus) {
						focusable(element);
					}

					if (element.type === 'checkbox' || element.type === 'radio') {
						// React set the value as empty string incorrectly when the value is undefined
						// This make sure the checkbox value falls back to the default value "on" properly
						// @see https://github.com/facebook/react/issues/17590
						element.value = optionsRef.current?.value ?? 'on';
					}

					initializeField(element, optionsRef.current);
				} else {
					const inputs = Array.from(element);
					const name = inputs[0]?.name ?? '';
					const type = inputs[0]?.type ?? '';

					if (
						!name ||
						!(type === 'checkbox' || type === 'radio') ||
						!inputs.every((input) => input.name === name && input.type === type)
					) {
						throw new Error(
							'You can only register a checkbox or radio group with the same name',
						);
					}

					inputRef.current = inputs;

					for (const input of inputs) {
						if (shouldHandleFocus) {
							focusable(input);
						}

						initializeField(input, {
							// We will not be uitlizing defaultChecked / value on checkbox / radio group
							defaultValue: optionsRef.current?.defaultValue,
						});
					}
				}
			},
			[shouldHandleFocus],
		),
		change: useCallback((value) => {
			if (!eventDispatched.current.change) {
				const element = Array.isArray(inputRef.current)
					? inputRef.current?.find((input) => {
							const wasChecked = input.checked;
							const isChecked = Array.isArray(value)
								? value.some((item) => item === input.value)
								: input.value === value;

							switch (input.type) {
								case 'checkbox':
									// We assume that only one checkbox can be checked at a time
									// So we will pick the first element with checked state changed
									return wasChecked !== isChecked;
								case 'radio':
									// We cannot uncheck a radio button
									// So we will pick the first element that should be checked
									return isChecked;
								default:
									return false;
							}
						})
					: inputRef.current;

				if (element) {
					change(
						element,
						typeof value === 'boolean' ? (value ? element.value : null) : value,
					);
				}
			}

			if (eventDispatched.current.change) {
				clearTimeout(eventDispatched.current.change);
			}

			eventDispatched.current.change = undefined;
		}, []),
		focus: useCallback(() => {
			if (!eventDispatched.current.focus) {
				const element = Array.isArray(inputRef.current)
					? inputRef.current[0]
					: inputRef.current;

				if (element) {
					focus(element);
				}
			}

			if (eventDispatched.current.focus) {
				clearTimeout(eventDispatched.current.focus);
			}

			eventDispatched.current.focus = undefined;
		}, []),
		blur: useCallback(() => {
			if (!eventDispatched.current.blur) {
				const element = Array.isArray(inputRef.current)
					? inputRef.current[0]
					: inputRef.current;

				if (element) {
					blur(element);
				}
			}

			if (eventDispatched.current.blur) {
				clearTimeout(eventDispatched.current.blur);
			}

			eventDispatched.current.blur = undefined;
		}, []),
	};
}
