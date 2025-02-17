/**
 * A type guard to check if the event target is an input element with an associated form.
 * If the form element is provided, it will ensure the input element is associated with the form.
 *
 * @example
 * ```ts
 * function handleInput(event: Event) {
 *   // Check if the event target is an input element
 *   if (isInput(event.target)) {
 *     // event.target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
 *   }
 *
 *   // If you are listening to the event higher up in the DOM tree
 *   if (isInput(event.target, formElement)) {
 *     // Only if the input element is associated with the specified form element
 *   }
 * }
 * ```
 *
 * @param target The event target
 * @param formElement The associated form element (optional)
 * @returns True if the target is an input element associated with the form, otherwise false
 */
export function isInput(
	target: unknown,
	formElement?: HTMLFormElement | null,
): target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
	return (
		(target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement) &&
		target.name !== '' &&
		(formElement ? target.form === formElement : target.form !== null)
	);
}

/**
 * Resolves the action from the submit event
 * with respect to the submitter's `formaction` attribute.
 *
 * @example
 * Imagine a form with two buttons: Update and Delete
 * ```html
 * <form action="/update">
 *   <button>Update</button>
 *   <button formaction="/delete">Delete</button>
 * </form>
 * ```
 *
 * You can resolve the action based on the submitter element in the submit event.
 * ```ts
 * function handleSubmit(event: SubmitEvent) {
 *   // If the "Update" button is clicked, it will return "/update"
 *   // If the "Delete" button is clicked, it will return "/delete"
 *   const action = getFormAction(event);
 * }
 * ```
 *
 * @param event The submit event
 * @returns The resolved action URL
 */
export function getFormAction(event: SubmitEvent): string {
	const form = event.target as HTMLFormElement;
	const submitter = event.submitter as
		| HTMLInputElement
		| HTMLButtonElement
		| null;

	return (
		submitter?.getAttribute('formaction') ??
		form.getAttribute('action') ??
		`${location.pathname}${location.search}`
	);
}

/**
 * Resolves the encoding type from the submit event
 * with respect to the submitter's `formenctype` attribute.
 *
 * @param event The submit event
 * @returns The resolved encoding type
 */
export function getFormEncType(
	event: SubmitEvent,
): 'application/x-www-form-urlencoded' | 'multipart/form-data' {
	const form = event.target as HTMLFormElement;
	const submitter = event.submitter as
		| HTMLInputElement
		| HTMLButtonElement
		| null;
	const encType = submitter?.getAttribute('formenctype') ?? form.enctype;

	if (encType === 'multipart/form-data') {
		return encType;
	}

	return 'application/x-www-form-urlencoded';
}

/**
 * Resolves the method from the submit event
 * with respect to the submitter's `formmethod` attribute.
 *
 * @example
 * Imagine a form with two buttons: Update and Delete
 * ```html
 * <form method="POST">
 *   <button>Update</button>
 *   <button formmethod="DELETE">Delete</button>
 * </form>
 * ```
 *
 * You can resolve the method based on the submitter element in the submit event.
 * ```ts
 * function handleSubmit(event: SubmitEvent) {
 *   // If the "Update" button is clicked, it will return "POST"
 *   // If the "Delete" button is clicked, it will return "DELETE"
 *   const method = getFormMethod(event);
 * }
 * ```
 *
 * @param event The submit event
 * @returns The resolved method
 */
export function getFormMethod(
	event: SubmitEvent,
): 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' {
	const form = event.target as HTMLFormElement;
	const submitter = event.submitter as
		| HTMLInputElement
		| HTMLButtonElement
		| null;
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
 * Creates a submit event that behaves like a real form submission.
 *
 * @param submitter The submitter element (optional)
 * @returns The created submit event
 */
export function createSubmitEvent(submitter?: HTMLElement | null): SubmitEvent {
	return new SubmitEvent('submit', {
		bubbles: true,
		cancelable: true,
		submitter,
	});
}

/**
 * Triggers form submission with an optional submitter.
 * If the `formElement.requestSubmit()` method is not available, it will dispatch a submit event instead.
 *
 * @param formElement The form element to submit
 * @param submitter The submitter element (optional)
 */
export function requestSubmit(
	formElement: HTMLFormElement,
	submitter?: HTMLInputElement | HTMLButtonElement | null,
): void {
	if (typeof formElement.requestSubmit === 'function') {
		formElement.requestSubmit(submitter);
	} else {
		formElement.dispatchEvent(createSubmitEvent(submitter));
	}
}

/**
 * Triggers form submission with an intent value. This is achieved by
 * creating a hidden button element with the intent value and then submitting it with the form.
 *
 * @param formElement The form element to submit
 * @param intentName The name of the intent field
 * @param intentValue The value of the intent field
 */
export function requestIntent(
	formElement: HTMLFormElement,
	intentName: string,
	intentValue: string,
): void {
	const submitter = document.createElement('button');

	submitter.name = intentName;
	submitter.value = intentValue;
	submitter.hidden = true;
	submitter.formNoValidate = true;

	formElement.appendChild(submitter);
	requestSubmit(formElement, submitter);
	formElement.removeChild(submitter);
}

/**
 * A type guard to checks if the element is a submitter element.
 * A submitter element is either an input or button element with type submit.
 */
export function isSubmitter(
	element: HTMLElement,
): element is HTMLInputElement | HTMLButtonElement {
	return 'type' in element && element.type === 'submit';
}

/**
 * Constructs form data with the submitter value.
 * It utilizes the submitter argument on the FormData constructor from modern browsers
 * with a fallback to append the submitter value if it is not supported.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData#parameters
 *
 * @param form The form element
 * @param submitter The submitter element (optional)
 * @returns The constructed FormData object
 */
export function getFormData(
	form: HTMLFormElement,
	submitter?: HTMLElement | null,
): FormData {
	const payload = new FormData(form, submitter);

	if (submitter) {
		if (!isSubmitter(submitter)) {
			throw new TypeError(
				'The submitter element must be a button or input element with type submit',
			);
		}

		if (submitter.name) {
			const entries = payload.getAll(submitter.name);

			// This assumes the submitter value to be always unique, which should be fine in most cases
			if (!entries.includes(submitter.value)) {
				payload.append(submitter.name, submitter.value);
			}
		}
	}

	return payload;
}
