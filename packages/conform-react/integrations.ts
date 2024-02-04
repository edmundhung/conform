import { type Key, useRef, useState, useMemo, useEffect } from 'react';

export type InputControl<Value> = {
	value: Value | undefined;
	change: (value: Value) => void;
	focus: () => void;
	blur: () => void;
};

export function getFormElement(formId: string): HTMLFormElement {
	const element = document.forms.namedItem(formId);

	if (!element) {
		throw new Error('Form not found');
	}

	return element;
}

export function getFieldElements(
	form: HTMLFormElement,
	name: string,
): Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
	const field = form.elements.namedItem(name);
	const elements = !field
		? []
		: field instanceof Element
		? [field]
		: Array.from(field.values());

	return elements.filter(
		(
			element,
		): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
			element instanceof HTMLInputElement ||
			element instanceof HTMLSelectElement ||
			element instanceof HTMLTextAreaElement,
	);
}

export function getEventTarget(
	form: HTMLFormElement,
	name: string,
): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
	const elements = getFieldElements(form, name);

	return elements[0] ?? null;
}

export function createDummySelect(
	form: HTMLFormElement,
	name: string,
	value?: string | string[] | undefined,
): HTMLSelectElement {
	const select = document.createElement('select');
	const options = Array.isArray(value) ? value : [value ?? ''];

	select.name = name;
	select.multiple = true;
	select.dataset.conform = 'true';

	// To make sure the input is hidden but still focusable
	select.setAttribute('aria-hidden', 'true');
	select.tabIndex = -1;
	select.style.position = 'absolute';
	select.style.width = '1px';
	select.style.height = '1px';
	select.style.padding = '0';
	select.style.margin = '-1px';
	select.style.overflow = 'hidden';
	select.style.clip = 'rect(0,0,0,0)';
	select.style.whiteSpace = 'nowrap';
	select.style.border = '0';

	for (const option of options) {
		select.options.add(new Option(option, option, true, true));
	}

	form.appendChild(select);

	return select;
}

export function isDummySelect(
	element: HTMLElement,
): element is HTMLSelectElement {
	return element.dataset.conform === 'true';
}

export function updateFieldValue(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	value: string | string[],
): void {
	if (
		element instanceof HTMLInputElement &&
		(element.type === 'checkbox' || element.type === 'radio')
	) {
		element.checked = element.value === value;
	} else if (element instanceof HTMLSelectElement && element.multiple) {
		const selectedValue = Array.isArray(value) ? [...value] : [value];

		for (const option of element.options) {
			const index = selectedValue.indexOf(option.value);
			const selected = index > -1;

			// Update the selected state of the option
			option.selected = selected;
			// Remove the option from the selected array
			if (selected) {
				selectedValue.splice(index, 1);
			}
		}

		// Add the remaining options to the select element only if it's a dummy element managed by conform
		if (isDummySelect(element)) {
			for (const option of selectedValue) {
				element.options.add(new Option(option, option, false, true));
			}
		}
	} else if (element.value !== value) {
		// No `change` event will be triggered on React if `element.value` is already updated

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

		if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
			prototypeValueSetter.call(element, value);
		} else {
			if (valueSetter) {
				valueSetter.call(element, value);
			} else {
				throw new Error('The given element does not have a value setter');
			}
		}
	}
}

export function useInputControl<
	Value extends string | string[],
>(metaOrOptions: {
	key?: Key | null | undefined;
	name: string;
	formId: string;
	initialValue?: Value | undefined;
}): InputControl<Value> {
	const eventDispatched = useRef({
		change: false,
		focus: false,
		blur: false,
	});
	const [key, setKey] = useState(metaOrOptions.key);
	const [initialValue, setInitialValue] = useState(metaOrOptions.initialValue);
	const [value, setValue] = useState(metaOrOptions.initialValue);

	if (key !== metaOrOptions.key) {
		setValue(metaOrOptions.initialValue);
		setInitialValue(metaOrOptions.initialValue);
		setKey(metaOrOptions.key);
	}

	useEffect(() => {
		const form = getFormElement(metaOrOptions.formId);

		if (getEventTarget(form, metaOrOptions.name)) {
			return;
		}

		createDummySelect(form, metaOrOptions.name, initialValue);

		return () => {
			const elements = getFieldElements(form, metaOrOptions.name);

			for (const element of elements) {
				if (isDummySelect(element)) {
					element.remove();
				}
			}
		};
	}, [metaOrOptions.formId, metaOrOptions.name, initialValue]);

	useEffect(() => {
		const createEventListener = (listener: 'change' | 'focus' | 'blur') => {
			return (event: Event) => {
				const element = event.target;

				if (
					(element instanceof HTMLInputElement ||
						element instanceof HTMLSelectElement ||
						element instanceof HTMLTextAreaElement) &&
					element.name === metaOrOptions.name &&
					element.form?.id === metaOrOptions.formId
				) {
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
	}, [metaOrOptions.formId, metaOrOptions.name]);

	const handlers = useMemo<Omit<InputControl<Value>, 'value'>>(() => {
		return {
			change(value) {
				if (!eventDispatched.current.change) {
					eventDispatched.current.change = true;

					const form = getFormElement(metaOrOptions.formId);
					const element = getEventTarget(form, metaOrOptions.name);

					if (element) {
						updateFieldValue(element, value);

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
					eventDispatched.current.focus = true;

					const form = getFormElement(metaOrOptions.formId);
					const element = getEventTarget(form, metaOrOptions.name);

					if (element) {
						element.dispatchEvent(
							new FocusEvent('focusin', {
								bubbles: true,
							}),
						);
						element.dispatchEvent(new FocusEvent('focus'));
					}
				}

				eventDispatched.current.focus = false;
			},
			blur() {
				if (!eventDispatched.current.blur) {
					eventDispatched.current.blur = true;

					const form = getFormElement(metaOrOptions.formId);
					const element = getEventTarget(form, metaOrOptions.name);

					if (element) {
						element.dispatchEvent(
							new FocusEvent('focusout', {
								bubbles: true,
							}),
						);
						element.dispatchEvent(new FocusEvent('blur'));
					}
				}

				eventDispatched.current.blur = false;
			},
		};
	}, [metaOrOptions.formId, metaOrOptions.name]);

	return {
		...handlers,
		value,
	};
}
