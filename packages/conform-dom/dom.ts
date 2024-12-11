import { invariant } from './util';

/**
 * Element that user can interact with,
 * includes `<input>`, `<select>` and `<textarea>`.
 */
export type FieldElement = (
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
) & { form: HTMLFormElement };

/**
 * HTML Element that can be used as a form control,
 * includes `<input>`, `<select>`, `<textarea>` and `<button>`.
 */
export type FormControl = FieldElement | HTMLButtonElement;

/**
 * Form Control element. It can either be a submit button or a submit input.
 */
export type Submitter = HTMLInputElement | HTMLButtonElement;

/**
 * A type guard to check if the provided element is a form control
 */
export function isFormControl(element: unknown): element is FormControl {
	return (
		element instanceof Element &&
		(element.tagName === 'INPUT' ||
			element.tagName === 'SELECT' ||
			element.tagName === 'TEXTAREA' ||
			element.tagName === 'BUTTON')
	);
}

/**
 * A type guard to check if the provided element is a field element, which
 * is a form control excluding submit, button and reset type.
 */
export function isFieldElement(
	element: unknown,
	form?: HTMLFormElement,
): element is FieldElement {
	return (
		isFormControl(element) &&
		element.type !== 'submit' &&
		element.type !== 'button' &&
		element.type !== 'reset' &&
		element.name !== '' &&
		element.form !== null &&
		element.form.isConnected &&
		(typeof form === 'undefined' || element.form === form)
	);
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

/**
 * Synchronizes the field elements with the provided state
 */
export function syncFieldValue(
	element: FieldElement,
	value: unknown,
	updateDefaultValue: boolean,
): void {
	const fieldValue =
		typeof value === 'string'
			? [value]
			: Array.isArray(value) && value.every((item) => typeof item === 'string')
				? value
				: [];

	if (element instanceof HTMLSelectElement) {
		for (const option of element.options) {
			option.selected = fieldValue.includes(option.value);

			if (updateDefaultValue) {
				option.defaultSelected = option.selected;
			}
		}
	} else if (
		element instanceof HTMLInputElement &&
		(element.type === 'checkbox' || element.type === 'radio')
	) {
		element.checked = fieldValue.includes(element.value);

		if (updateDefaultValue) {
			element.defaultChecked = element.checked;
		}
	} else {
		element.value = fieldValue[0] ?? '';

		if (updateDefaultValue) {
			element.defaultValue = element.value;
		}
	}
}

export function syncFieldConstraint(
	element: FieldElement,
	constraint: {
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		min?: string | number;
		max?: string | number;
		step?: string | number;
		multiple?: boolean;
		pattern?: string;
	},
): void {
	if (
		typeof constraint.required !== 'undefined' &&
		// If the element is a part of the checkbox group, it is unclear whether all checkboxes are required or only one.
		!(
			element.type === 'checkbox' &&
			element.form.elements.namedItem(element.name) instanceof RadioNodeList
		)
	) {
		element.required = constraint.required;
	}

	if (typeof constraint.multiple !== 'undefined' && 'multiple' in element) {
		element.multiple = constraint.multiple;
	}

	if (typeof constraint.minLength !== 'undefined' && 'minLength' in element) {
		element.minLength = constraint.minLength;
	}

	if (typeof constraint.maxLength !== 'undefined' && 'maxLength' in element) {
		element.maxLength = constraint.maxLength;
	}
	if (typeof constraint.min !== 'undefined' && 'min' in element) {
		element.min = `${constraint.min}`;
	}

	if (typeof constraint.max !== 'undefined' && 'max' in element) {
		element.max = `${constraint.max}`;
	}

	if (typeof constraint.step !== 'undefined' && 'step' in element) {
		element.step = `${constraint.step}`;
	}

	if (typeof constraint.pattern !== 'undefined' && 'pattern' in element) {
		element.pattern = constraint.pattern;
	}
}
