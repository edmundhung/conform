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
export function isFieldElement(element: unknown): element is FieldElement {
	return (
		isFormControl(element) &&
		element.type !== 'submit' &&
		element.type !== 'button' &&
		element.type !== 'reset'
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

	// if (typeof form.requestSubmit === 'function') {
	// 	form.requestSubmit(submitter);
	// } else {
	const event = new SubmitEvent('submit', {
		bubbles: true,
		cancelable: true,
		submitter,
	});

	form.dispatchEvent(event);
	// }
}
