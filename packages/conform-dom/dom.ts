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

		for (const mutation of mutations) {
			switch (mutation.type) {
				case 'childList': {
					const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
					for (const node of nodes) {
						for (const input of collectInputs(node)) {
							seenInputs.add(input);
							if (input.form) {
								seenForms.add(input.form);
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
	updateFieldValue(element, value, {
		emitEvents: true,
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

export function getFieldValue(
	element:
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| Array<HTMLInputElement>,
): string | string[] | File | File[] | null {
	if (Array.isArray(element)) {
		let result: string[] | null = null;
		const name = element[0]?.name;

		for (const input of element) {
			if (input.name !== name) {
				throw new Error('The inputs provided must have the same name');
			}

			switch (input.type) {
				case 'radio':
					if (input.checked) {
						return input.value;
					}
					break;
				case 'checkbox':
					result ??= [];
					if (input.checked) {
						result.push(input.value);
					}
					break;
				default:
					throw new Error(
						'The inputs provided must be checkboxes or radio groups',
					);
			}
		}

		return result;
	}

	if (element instanceof HTMLInputElement) {
		if (element.type === 'radio' || element.type === 'checkbox') {
			return element.checked ? element.value : null;
		}

		if (element.type === 'file') {
			const files = Array.from(element.files ?? []);

			if (element.multiple) {
				return files;
			}

			return files[0] ?? null;
		}

		return element.value;
	}

	if (element instanceof HTMLSelectElement) {
		const selectedValue = Array.from(element.selectedOptions).map(
			(option) => option.value,
		);

		if (element.multiple) {
			return selectedValue;
		}

		// TODO: verify the behavior of single select
		// There should be no way to unselect a single select as the browser will select the first option
		// But what if there is no option in the select?
		return selectedValue[0] ?? null;
	}

	return element.value;
}

/**
 * Updates the DOM element with the provided value.
 */
export function updateFieldValue(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	value: string | string[] | File | File[] | FileList | null | undefined,
	options?: {
		/**
		 * Whether the default value should be updated. Set to true if you want to reset the field with a new default value.
		 */
		defaultValue?:
			| string
			| string[]
			| File
			| File[]
			| FileList
			| null
			| undefined;
		/**
		 * Whether to emit events for the update. Set to true if you want to trigger the onChange event handler in React.
		 */
		emitEvents?: boolean;
	},
): void {
	function isStringArray(value: unknown): value is string[] {
		return (
			Array.isArray(value) &&
			value.every((option): option is string => typeof option === 'string')
		);
	}

	function resolveStrings(
		value: string | string[] | File | File[] | FileList | null | undefined,
	): string[] | null {
		if (typeof value === 'undefined') {
			return null;
		}

		if (value === null) {
			return [];
		}

		if (typeof value === 'string') {
			return [value];
		}

		if (isStringArray(value)) {
			return value;
		}

		throw new Error(
			'The value provided for a string input must be a string or a string array',
		);
	}

	function resovleFileList(
		value: string | string[] | File | File[] | FileList | null | undefined,
	): FileList | null {
		if (typeof value === 'undefined') {
			return null;
		}

		if (value === null) {
			return createFileList([]);
		}

		if (value instanceof FileList) {
			return value;
		}

		if (typeof value !== 'string' && !isStringArray(value)) {
			return createFileList(value);
		}

		throw new Error(
			'The value provided for a file input must be a File, a File array, a FileList or null',
		);
	}

	if (isInputElement(element)) {
		switch (element.type) {
			case 'file': {
				element.files =
					resovleFileList(value) ??
					resovleFileList(options?.defaultValue ?? null);
				return;
			}
			case 'checkbox':
			case 'radio': {
				const defaultChecked =
					resolveStrings(options?.defaultValue)?.includes(element.value) ??
					element.defaultChecked;
				const isChecked =
					resolveStrings(value)?.includes(element.value) ?? defaultChecked;

				if (!options?.emitEvents) {
					element.checked = isChecked;
				} else if (element.checked !== isChecked) {
					element.click();
				}

				element.defaultChecked = defaultChecked;
				return;
			}
		}
	}

	if (isSelectElement(element)) {
		const defaultSelectedOptions =
			resolveStrings(options?.defaultValue) ??
			Array.from(element.options).reduce<string[]>((result, option) => {
				if (option.defaultSelected) {
					result.push(option.value);
				}
				return result;
			}, []);
		const selectedOptions = resolveStrings(value);

		// If the select element is not multiple and the value is an empty array, unset the selected index
		// This is to prevent the select element from showing the first option as selected
		if (
			!element.multiple &&
			(selectedOptions ?? defaultSelectedOptions).length === 0
		) {
			element.selectedIndex = -1;
		}

		for (const option of element.options) {
			const defaultSelected = defaultSelectedOptions.includes(option.value);
			const selected =
				selectedOptions?.includes(option.value) ?? defaultSelected;

			// Update the default selected state of the option
			option.defaultSelected = defaultSelected;
			// Update the selected state of the option and fallback to defaultSelected if not provided
			option.selected = selected;

			// Remove the available option from the selectedOptions
			if (selected) {
				selectedOptions?.splice(selectedOptions.indexOf(option.value), 1);
			}

			if (defaultSelected) {
				defaultSelectedOptions?.splice(
					defaultSelectedOptions.indexOf(option.value),
					1,
				);
			}
		}

		// We have already removed all selected options from the value and defaultValue array at this point
		const missingOptions = new Set<string>([
			...(selectedOptions ?? []),
			...(defaultSelectedOptions ?? []),
		]);

		for (const optionValue of missingOptions) {
			const defaultSelected = defaultSelectedOptions.includes(optionValue);

			element.options.add(
				new Option(
					optionValue,
					optionValue,
					defaultSelected,
					selectedOptions?.includes(optionValue) ?? defaultSelected,
				),
			);
		}
		return;
	}

	const defaultInputValue = resolveStrings(options?.defaultValue);
	const inputValue =
		(resolveStrings(value) ?? defaultInputValue ?? [element.defaultValue])[0] ??
		'';

	if (!options?.emitEvents) {
		element.value = inputValue;
	} else {
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
		} else {
			if (valueSetter) {
				valueSetter.call(element, inputValue);
			} else {
				throw new Error('The given element does not have a value setter');
			}
		}
	}

	if (defaultInputValue) {
		element.defaultValue = defaultInputValue[0] ?? '';
	}
}
