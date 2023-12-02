import {
	type FieldElement,
	type FormValue,
	isFieldElement,
} from '@conform-to/dom';
import { useRef, useState, useMemo, useEffect } from 'react';
import { type FieldMetadata } from './context';

export type InputControl<Value> = {
	value: Value;
	change: (value: Value) => void;
	focus: () => void;
	blur: () => void;
};

export function getFieldElement(
	formId: string,
	name: string,
	match: (element: FieldElement) => boolean = () => true,
): FieldElement | null {
	const element = document.forms.namedItem(formId)?.elements.namedItem(name);

	if (element) {
		const items =
			element instanceof Element ? [element] : Array.from(element.values());

		for (const item of items) {
			if (isFieldElement(item) && match(item)) {
				return item;
			}
		}
	}

	return null;
}

export function getEventTarget(formId: string, name: string): FieldElement {
	const element = getFieldElement(formId, name);

	if (element) {
		return element;
	}

	const form = document.forms.namedItem(formId);
	const input = document.createElement('input');

	input.type = 'hidden';
	input.name = name;

	form?.appendChild(input);

	return input;
}

export function useInputControl<Schema>(
	metadata: FieldMetadata<Schema, any, any>,
	options?: {
		onFocus?: (event: Event) => void;
	},
): InputControl<string | undefined>;
export function useInputControl<Schema, Value>(
	metadata: FieldMetadata<Schema, any, any>,
	options: {
		initialize: (value: FormValue<Schema> | undefined) => Value;
		serialize?: (value: Value) => string;
		onFocus?: (event: Event) => void;
	},
): InputControl<Value>;
export function useInputControl<Schema, Value>(
	metadata: FieldMetadata<Schema, any, any>,
	options?: {
		initialize?: (value: FormValue<Schema> | undefined) => Value;
		serialize?: (value: Value | string | undefined) => string;
		onFocus?: (event: Event) => void;
	},
): InputControl<Value | string | undefined> {
	const eventDispatched = useRef({
		change: false,
		focus: false,
		blur: false,
	});
	const [key, setKey] = useState(metadata.key);
	const optionsRef = useRef(options);
	const initialize = options?.initialize ?? ((value) => value?.toString());
	const [value, setValue] = useState(() => initialize(metadata.initialValue));

	if (key !== metadata.key) {
		setValue(initialize(metadata.initialValue));
		setKey(metadata.key);
	}

	useEffect(() => {
		optionsRef.current = options;
	});

	useEffect(() => {
		const createEventListener = (listener: 'change' | 'focus' | 'blur') => {
			return (event: Event) => {
				const element = getFieldElement(
					metadata.formId,
					metadata.name,
					(element) => element === event.target,
				);

				if (element) {
					if (listener === 'focus') {
						optionsRef.current?.onFocus?.(event);
					}

					eventDispatched.current[listener] = true;
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
	}, [metadata.formId, metadata.name]);

	const handlers = useMemo<
		Omit<InputControl<Value | string | undefined>, 'value'>
	>(() => {
		return {
			change(value) {
				if (!eventDispatched.current.change) {
					const element = getEventTarget(metadata.formId, metadata.name);
					const serializedValue =
						optionsRef.current?.serialize?.(value) ?? value?.toString() ?? '';

					eventDispatched.current.change = true;

					if (
						element instanceof HTMLInputElement &&
						(element.type === 'checkbox' || element.type === 'radio')
					) {
						if (
							element.checked
								? element.value !== serializedValue
								: element.value === serializedValue
						) {
							element.click();
						}
					} else {
						// No change event will be triggered on React if `element.value` is already updated
						if (element.value !== serializedValue) {
							/**
							 * Triggering react custom change event
							 * Solution based on dom-testing-library
							 * @see https://github.com/facebook/react/issues/10135#issuecomment-401496776
							 * @see https://github.com/testing-library/dom-testing-library/blob/main/src/events.js#L104-L123
							 */
							const { set: valueSetter } =
								Object.getOwnPropertyDescriptor(element, 'value') || {};
							const prototype = Object.getPrototypeOf(element);
							const { set: prototypeValueSetter } =
								Object.getOwnPropertyDescriptor(prototype, 'value') || {};

							if (
								prototypeValueSetter &&
								valueSetter !== prototypeValueSetter
							) {
								prototypeValueSetter.call(element, value);
							} else {
								if (valueSetter) {
									valueSetter.call(element, value);
								} else {
									throw new Error(
										'The given element does not have a value setter',
									);
								}
							}
						}

						// Dispatch input event with the updated input value
						element.dispatchEvent(new InputEvent('input', { bubbles: true }));
						// Dispatch change event (necessary for select to update the selected option)
						element.dispatchEvent(new Event('change', { bubbles: true }));
					}
				}

				setValue(value);

				eventDispatched.current.change = false;
			},
			focus() {
				if (!eventDispatched.current.focus) {
					const element = getEventTarget(metadata.formId, metadata.name);

					eventDispatched.current.focus = true;
					element.dispatchEvent(
						new FocusEvent('focusin', {
							bubbles: true,
						}),
					);
					element.dispatchEvent(new FocusEvent('focus'));
				}

				eventDispatched.current.focus = false;
			},
			blur() {
				if (!eventDispatched.current.blur) {
					const element = getEventTarget(metadata.formId, metadata.name);

					eventDispatched.current.blur = true;
					element.dispatchEvent(
						new FocusEvent('focusout', {
							bubbles: true,
						}),
					);
					element.dispatchEvent(new FocusEvent('blur'));
				}

				eventDispatched.current.blur = false;
			},
		};
	}, [metadata.formId, metadata.name]);

	return {
		...handlers,
		value,
	};
}
