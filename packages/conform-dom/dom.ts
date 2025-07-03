import { isGlobalInstance } from './formdata';
import { invariant } from './util';

/**
 * Element that user can interact with,
 * includes `<input>`, `<select>` and `<textarea>`.
 */
export type FieldElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement;

/**
 * Form Control element. It can either be a submit button or a submit input.
 */
export type Submitter = HTMLInputElement | HTMLButtonElement;

export function isInputElement(element: Element): element is HTMLInputElement {
	return element.tagName === 'INPUT';
}

export function isSelectElement(
	element: Element,
): element is HTMLSelectElement {
	return element.tagName === 'SELECT';
}

export function isTextAreaElement(
	element: Element,
): element is HTMLTextAreaElement {
	return element.tagName === 'TEXTAREA';
}

/**
 * A type guard to check if the provided element is a field element, which
 * is a form control excluding submit, button and reset type.
 */
export function isFieldElement(element: unknown): element is FieldElement {
	if (element instanceof Element) {
		if (isInputElement(element)) {
			return (
				element.type !== 'submit' &&
				element.type !== 'button' &&
				element.type !== 'reset'
			);
		}

		if (isSelectElement(element) || isTextAreaElement(element)) {
			return true;
		}
	}

	return false;
}

/**
 * Resolves the action from the submit event
 * with respect to the submitter `formaction` attribute.
 */
export function getFormAction(event: SubmitEvent): string {
	const form = event.target as HTMLFormElement;
	const submitter = event.submitter as Submitter | null;

	return (
		submitter?.getAttribute('formaction') ??
		form.getAttribute('action') ??
		`${location.pathname}${location.search}`
	);
}

/**
 * Resolves the encoding type from the submit event
 * with respect to the submitter `formenctype` attribute.
 */
export function getFormEncType(
	event: SubmitEvent,
): 'application/x-www-form-urlencoded' | 'multipart/form-data' {
	const form = event.target as HTMLFormElement;
	const submitter = event.submitter as Submitter | null;
	const encType = submitter?.getAttribute('formenctype') ?? form.enctype;

	if (encType === 'multipart/form-data') {
		return encType;
	}

	return 'application/x-www-form-urlencoded';
}

/**
 * Resolves the method from the submit event
 * with respect to the submitter `formmethod` attribute.
 */
export function getFormMethod(
	event: SubmitEvent,
): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' {
	const form = event.target as HTMLFormElement;
	const submitter = event.submitter as Submitter | null;
	const method = (
		submitter?.getAttribute('formmethod') ?? form.getAttribute('method')
	)?.toUpperCase();

	switch (method) {
		case 'POST':
		case 'PUT':
		case 'PATCH':
		case 'DELETE':
			return method;
	}

	return 'GET';
}

/**
 * Trigger a form submit event with an optional submitter.
 * If the submitter is not mounted, it will be appended to the form and removed after submission.
 */
export function requestSubmit(
	form: HTMLFormElement | null | undefined,
	submitter: Submitter | null,
): void {
	invariant(
		!!form,
		'Failed to submit the form. The element provided is null or undefined.',
	);

	if (typeof form.requestSubmit === 'function') {
		form.requestSubmit(submitter);
	} else {
		const event = new SubmitEvent('submit', {
			bubbles: true,
			cancelable: true,
			submitter,
		});

		form.dispatchEvent(event);
	}
}

export function createFileList(value: File | File[]): FileList {
	const dataTransfer = new DataTransfer();

	if (Array.isArray(value)) {
		for (const file of value) {
			dataTransfer.items.add(file);
		}
	} else {
		dataTransfer.items.add(value);
	}

	return dataTransfer.files;
}

type InputCallback = (event: {
	type: 'input' | 'reset' | 'mutation';
	target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
}) => void;

type FormCallback = (event: {
	type: 'submit' | 'input' | 'reset' | 'mutation';
	target: HTMLFormElement;
	submitter?: HTMLInputElement | HTMLButtonElement | null;
}) => void;

export function createGlobalFormsObserver() {
	const inputListeners = new Set<InputCallback>();
	const formListeners = new Set<FormCallback>();

	let cleanup: (() => void) | null = null;

	function initialize() {
		const observer = new MutationObserver(handleMutation);
		observer.observe(document.body, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeOldValue: true,
			attributeFilter: ['form', 'name', 'data-conform'],
		});

		document.addEventListener('input', handleInput);
		document.addEventListener('reset', handleReset);
		document.addEventListener('submit', handleSubmit, true);

		return () => {
			document.removeEventListener('input', handleInput);
			document.removeEventListener('reset', handleReset);
			document.removeEventListener('submit', handleSubmit, true);
			observer.disconnect();
		};
	}

	function handleInput(event: Event) {
		const target = event.target;

		if (isFieldElement(target)) {
			inputListeners.forEach((callback) => callback({ type: 'input', target }));
			const form = target.form;
			if (form) {
				formListeners.forEach((callback) =>
					callback({ type: 'input', target: form }),
				);
			}
		}
	}

	function handleReset(event: Event) {
		const form = event.target;

		if (form instanceof HTMLFormElement) {
			// Reset event is fired before the form is reset, so we need to wait for the next tick
			setTimeout(() => {
				formListeners.forEach((callback) => {
					callback({ type: 'reset', target: form });
				});
				for (const target of form.elements) {
					if (isFieldElement(target)) {
						inputListeners.forEach((callback) => {
							callback({ type: 'reset', target });
						});
					}
				}
			});
		}
	}

	function handleSubmit(event: SubmitEvent) {
		const target = event.target;
		const submitter = event.submitter as HTMLInputElement | HTMLButtonElement;
		if (target instanceof HTMLFormElement) {
			formListeners.forEach((callback) =>
				callback({ type: 'submit', target, submitter }),
			);
		}
	}

	function getAssociatedFormElement(
		formId: string | null,
		node: Node,
	): HTMLFormElement | null {
		if (formId !== null) {
			return document.forms.namedItem(formId);
		}

		if (node instanceof Element) {
			return node.closest('form');
		}

		return null;
	}

	function handleMutation(mutations: MutationRecord[]) {
		const seenForms = new Set<HTMLFormElement>();
		const seenInputs = new Set<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>();

		const collectInputs = (node: Node) => {
			if (isFieldElement(node)) {
				return [node];
			}

			return node instanceof Element
				? Array.from(
						node.querySelectorAll<
							HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
						>('input,select,textarea'),
					)
				: [];
		};

		const collectForms = (node: Node) => {
			if (node instanceof HTMLFormElement) {
				return [node];
			}

			return node instanceof Element
				? Array.from(node.querySelectorAll<HTMLFormElement>('form'))
				: [];
		};

		for (const mutation of mutations) {
			switch (mutation.type) {
				case 'childList': {
					const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
					for (const node of nodes) {
						for (const form of collectForms(node)) {
							seenForms.add(form);
						}

						for (const input of collectInputs(node)) {
							seenInputs.add(input);

							const form =
								input.form ??
								getAssociatedFormElement(
									input.getAttribute('form'),
									mutation.target,
								);

							if (form) {
								seenForms.add(form);
							}
						}
					}
					break;
				}
				case 'attributes': {
					if (isFieldElement(mutation.target)) {
						seenInputs.add(mutation.target);

						if (mutation.target.form) {
							seenForms.add(mutation.target.form);
						}

						if (mutation.attributeName === 'form') {
							const oldForm = getAssociatedFormElement(
								mutation.oldValue,
								mutation.target,
							);

							if (oldForm) {
								seenForms.add(oldForm);
							}
						}
					}
					break;
				}
			}
		}

		for (const target of seenForms) {
			formListeners.forEach((callback) => {
				callback({ type: 'mutation', target });
			});
		}
		for (const target of seenInputs) {
			inputListeners.forEach((callback) => {
				callback({ type: 'mutation', target });
			});
		}
	}

	return {
		onFieldUpdate(callback: InputCallback) {
			cleanup = cleanup ?? initialize();
			inputListeners.add(callback);
			return () => {
				inputListeners.delete(callback);
			};
		},
		onFormUpdate(callback: FormCallback) {
			cleanup = cleanup ?? initialize();
			formListeners.add(callback);
			return () => {
				formListeners.delete(callback);
			};
		},
		dispose() {
			cleanup?.();
			cleanup = null;
			inputListeners.clear();
			formListeners.clear();
		},
	};
}

export function change(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	value: string | string[] | File | File[] | FileList | null,
): void {
	// The value should be set to the element before dispatching the event
	updateField(element, {
		value,
	});

	// Dispatch input event with the updated input value
	element.dispatchEvent(new InputEvent('input', { bubbles: true }));
	// Dispatch change event (necessary for select to update the selected option)
	element.dispatchEvent(new Event('change', { bubbles: true }));
}

export function focus(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): void {
	// Only focusin event will be bubbled
	element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
	element.dispatchEvent(new FocusEvent('focus'));
}

export function blur(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): void {
	// Only focusout event will be bubbled
	element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
	element.dispatchEvent(new FocusEvent('blur'));
}

export function normalizeStringValues(value: unknown): string[] | undefined {
	if (typeof value === 'undefined') return undefined;
	if (value === null) return [];
	if (typeof value === 'string') return [value];
	if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
		return Array.from(value);
	}

	throw new Error('Expected string or string[] value for string based input');
}

export function normalizeFileValues(value: unknown): FileList | undefined {
	if (typeof value === 'undefined') return undefined;
	if (value === null) return createFileList([]);
	if (isGlobalInstance(value, 'File')) return createFileList([value]);
	if (isGlobalInstance(value, 'FileList')) return value;
	if (
		Array.isArray(value) &&
		value.every((item) => isGlobalInstance(item, 'File'))
	) {
		return createFileList(value);
	}

	throw new Error('Expected File, FileList or File[] for file input');
}

/**
 * Updates the DOM element with the provided value and defaultValue.
 * If the value or defaultValue is undefined, it will keep the current value instead
 */
export function updateField(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	options: {
		value?: unknown;
		defaultValue?: unknown;
	},
) {
	if (isInputElement(element)) {
		switch (element.type) {
			case 'file': {
				const files = normalizeFileValues(options.value);
				if (files) {
					element.files = files;
				}
				return;
			}
			case 'checkbox':
			case 'radio': {
				const value = normalizeStringValues(options.value);
				const defaultValue = normalizeStringValues(options.defaultValue);

				if (value) {
					const checked = value.includes(element.value);

					if (
						element.type === 'checkbox' ? checked !== element.checked : checked
					) {
						// Simulate a click to update the checked state
						element.click();
					}

					element.checked = checked;
				}
				if (defaultValue) {
					element.defaultChecked = defaultValue.includes(element.value);
				}
				return;
			}
		}
	} else if (isSelectElement(element)) {
		const value = normalizeStringValues(options.value);
		const defaultValue = normalizeStringValues(options.defaultValue);
		const shouldUnselect = value && value.length === 0;

		for (const option of element.options) {
			if (value) {
				const index = value.indexOf(option.value);
				const selected = index > -1;

				// Update the selected state of the option
				if (option.selected !== selected) {
					option.selected = selected;
				}

				// Remove the option from the value array
				if (selected) {
					value.splice(index, 1);
				}
			}
			if (defaultValue) {
				const index = defaultValue.indexOf(option.value);
				const selected = index > -1;

				// Update the selected state of the option
				if (option.defaultSelected !== selected) {
					option.defaultSelected = selected;
				}

				// Remove the option from the defaultValue array
				if (selected) {
					defaultValue.splice(index, 1);
				}
			}
		}

		// We have already removed all selected options from the value and defaultValue array at this point
		const missingOptions = new Set([...(value ?? []), ...(defaultValue ?? [])]);

		for (const optionValue of missingOptions) {
			element.options.add(
				new Option(
					optionValue,
					optionValue,
					defaultValue?.includes(optionValue),
					value?.includes(optionValue),
				),
			);
		}

		// If the select element is not multiple and the value is an empty array, unset the selected index
		// This is to prevent the select element from showing the first option as selected
		if (shouldUnselect) {
			element.selectedIndex = -1;
		}
		return;
	}

	const value = normalizeStringValues(options.value);
	const defaultValue = normalizeStringValues(options.defaultValue);
	const inputValue = value?.[0] ?? '';

	if (element.value !== inputValue) {
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
			prototypeValueSetter.call(element, inputValue);
		} else if (valueSetter) {
			valueSetter.call(element, inputValue);
		} else {
			throw new Error('The given element does not have a value setter');
		}
	}
	if (defaultValue) {
		element.defaultValue = defaultValue[0] ?? '';
	}
}
