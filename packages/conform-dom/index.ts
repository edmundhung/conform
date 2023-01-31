export type Primitive = null | undefined | string | number | boolean | Date;

export type FieldElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
	| HTMLButtonElement;

export interface FieldConfig<Schema = unknown> extends FieldConstraint<Schema> {
	id?: string;
	name: string;
	defaultValue?: FieldValue<Schema>;
	initialError?: Array<[string, string]>;
	form?: string;
	errorId?: string;
}

export type FieldValue<Schema> = Schema extends Primitive
	? string
	: Schema extends File
	? File
	: Schema extends Array<infer InnerType>
	? Array<FieldValue<InnerType>>
	: Schema extends Record<string, any>
	? { [Key in keyof Schema]?: FieldValue<Schema[Key]> }
	: unknown;

export type FieldConstraint<Schema = any> = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: Schema extends number ? number : string | number;
	max?: Schema extends number ? number : string | number;
	step?: Schema extends number ? number : string | number;
	multiple?: boolean;
	pattern?: string;
};

export type FieldsetConstraint<Schema extends Record<string, any>> = {
	[Key in keyof Schema]?: FieldConstraint<Schema[Key]>;
};

export type Submission<Schema = unknown> = {
	type: string;
	intent?: string;
	value: FieldValue<Schema>;
	error: Array<[string, string]>;
};

export interface CommandButtonProps<Name extends string = string> {
	name: `conform/${Name}`;
	value: string;
	formNoValidate?: boolean;
}

export function isFieldElement(element: unknown): element is FieldElement {
	return (
		element instanceof Element &&
		(element.tagName === 'INPUT' ||
			element.tagName === 'SELECT' ||
			element.tagName === 'TEXTAREA' ||
			element.tagName === 'BUTTON')
	);
}

export function getFormElements(form: HTMLFormElement): FieldElement[] {
	return Array.from(form.elements).filter(isFieldElement);
}

export function getPaths(name: string): Array<string | number> {
	const pattern = /(\w*)\[(\d+)\]/;

	if (!name) {
		return [];
	}

	return name.split('.').flatMap((key) => {
		const matches = pattern.exec(key);

		if (!matches) {
			return key;
		}

		if (matches[1] === '') {
			return Number(matches[2]);
		}

		return [matches[1], Number(matches[2])];
	});
}

export function getFormData(
	form: HTMLFormElement,
	submitter?: HTMLInputElement | HTMLButtonElement | null,
): FormData {
	const payload = new FormData(form);

	if (submitter?.name) {
		payload.append(submitter.name, submitter.value);
	}

	return payload;
}

export function getName(paths: Array<string | number>): string {
	return paths.reduce<string>((name, path) => {
		if (typeof path === 'number') {
			return `${name}[${path}]`;
		}

		if (name === '' || path === '') {
			return [name, path].join('');
		}

		return [name, path].join('.');
	}, '');
}

export function shouldValidate(submission: Submission, name: string): boolean {
	return (
		submission.type === 'submit' ||
		(submission.type === 'validate' &&
			(submission.intent === '' || submission.intent === name)) ||
		(submission.type === 'list' &&
			typeof submission.intent !== 'undefined' &&
			parseListCommand(submission.intent).scope === name)
	);
}

export function hasError(
	error: Array<[string, string]>,
	name?: string,
): boolean {
	return (
		typeof error.find(
			([fieldName, message]) =>
				(typeof name === 'undefined' || name === fieldName) && message !== '',
		) !== 'undefined'
	);
}

export function reportSubmission(
	form: HTMLFormElement,
	submission: Submission,
): void {
	const messageByName: Map<string, string> = new Map();
	let scope: string | null = null;

	if (submission.type === 'list' && typeof submission.intent !== 'undefined') {
		scope = parseListCommand(submission.intent).scope;
		form.dispatchEvent(
			new CustomEvent('conform/list', {
				detail: submission.intent,
			}),
		);
	}

	for (const [name, message] of submission.error) {
		if (scope !== null && name !== scope) {
			// Skip if not matching the scope
			continue;
		}

		if (!messageByName.has(name)) {
			// Only keep the first error message (for now)
			messageByName.set(name, message);

			// We can't use empty string as button name
			// As `form.element.namedItem('')` will always returns null
			const elementName = name ? name : '__form__';
			let item = form.elements.namedItem(elementName);

			if (item instanceof RadioNodeList) {
				for (const field of item) {
					if ((field as FieldElement).type !== 'radio') {
						throw new Error('Repeated field name is not supported');
					}
				}
			}

			if (item === null) {
				// Create placeholder button to keep the error without contributing to the form data
				const button = document.createElement('button');

				button.name = elementName;
				button.hidden = true;
				button.dataset.conformTouched = 'true';
				item = button;

				form.appendChild(button);
			}
		}
	}

	for (const element of form.elements) {
		if (isFieldElement(element) && element.willValidate) {
			const elementName = element.name !== '__form__' ? element.name : '';
			const message = messageByName.get(elementName);
			const elementShouldValidate = shouldValidate(submission, elementName);

			if (elementShouldValidate) {
				element.dataset.conformTouched = 'true';
			}

			if (typeof message !== 'undefined' || elementShouldValidate) {
				const invalidEvent = new Event('invalid', { cancelable: true });

				element.setCustomValidity(message ?? '');
				element.dispatchEvent(invalidEvent);
			}

			if (elementShouldValidate && !element.validity.valid) {
				focus(element);
			}
		}
	}
}

export function setValue<T>(
	target: any,
	paths: Array<string | number>,
	valueFn: (prev?: T) => T,
): void {
	let length = paths.length;
	let lastIndex = length - 1;
	let index = -1;
	let pointer = target;

	while (pointer != null && ++index < length) {
		let key = paths[index];
		let next = paths[index + 1];
		let newValue =
			index != lastIndex
				? pointer[key] ?? (typeof next === 'number' ? [] : {})
				: valueFn(pointer[key]);

		pointer[key] = newValue;
		pointer = pointer[key];
	}
}

/**
 * The ponyfill of `HTMLFormElement.requestSubmit()`
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit
 * @see https://caniuse.com/?search=requestSubmit
 */
export function requestSubmit(
	form: HTMLFormElement,
	submitter?: HTMLButtonElement | HTMLInputElement,
): void {
	const submitEvent = new SubmitEvent('submit', {
		bubbles: true,
		cancelable: true,
		submitter,
	});

	form.dispatchEvent(submitEvent);
}

/**
 * Creates a command button on demand and trigger a form submit by clicking it.
 */
export function requestCommand(
	form: HTMLFormElement | undefined,
	buttonProps: CommandButtonProps,
): void {
	if (!form) {
		console.warn('No form element is provided');
		return;
	}

	const button = document.createElement('button');

	button.name = buttonProps.name;
	button.value = buttonProps.value;
	button.hidden = true;

	if (buttonProps.formNoValidate) {
		button.formNoValidate = true;
	}

	form.appendChild(button);
	button.click();
	form.removeChild(button);
}

/**
 * Returns the properties required to configure a command button for validation
 *
 * @see https://conform.guide/api/react#validate
 */
export function validate(field?: string): CommandButtonProps<'validate'> {
	return {
		name: 'conform/validate',
		value: field ?? '',
		formNoValidate: true,
	};
}

export function getFormElement(
	element:
		| HTMLFormElement
		| HTMLFieldSetElement
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| HTMLButtonElement
		| null,
): HTMLFormElement | null {
	const form = element instanceof HTMLFormElement ? element : element?.form;

	if (!form) {
		return null;
	}

	return form;
}

export function focus(field: FieldElement): void {
	const currentFocus = document.activeElement;

	if (
		!isFieldElement(currentFocus) ||
		currentFocus.tagName !== 'BUTTON' ||
		currentFocus.form !== field.form
	) {
		return;
	}

	field.focus();
}

export function getSubmissionType(name: string): string | null {
	const prefix = 'conform/';

	if (!name.startsWith(prefix) || name.length <= prefix.length) {
		return null;
	}

	return name.slice(prefix.length);
}

export function parse<Schema extends Record<string, any>>(
	payload: FormData | URLSearchParams,
): Submission<Schema> {
	let hasCommand = false;
	let submission: Submission<Record<string, unknown>> = {
		type: 'submit',
		value: {},
		error: [],
	};

	try {
		for (let [name, value] of payload.entries()) {
			const submissionType = getSubmissionType(name);

			if (submissionType) {
				if (typeof value !== 'string') {
					throw new Error(
						'The conform command could not be used on a file input',
					);
				}

				if (hasCommand) {
					throw new Error('The conform command could only be set on a button');
				}

				submission = {
					...submission,
					type: submissionType,
					intent: value,
				};
				hasCommand = true;
			} else {
				const paths = getPaths(name);

				setValue(submission.value, paths, (prev) => {
					if (!prev) {
						return value;
					} else if (Array.isArray(prev)) {
						return prev.concat(value);
					} else {
						return [prev, value];
					}
				});
			}
		}

		if (submission.type === 'list') {
			submission = handleList(submission);
		}
	} catch (e) {
		submission.error.push([
			'',
			e instanceof Error ? e.message : 'Invalid payload received',
		]);
	}

	return submission as Submission<Schema>;
}

export type ListCommand<Schema = unknown> =
	| { type: 'prepend'; scope: string; payload: { defaultValue: Schema } }
	| { type: 'append'; scope: string; payload: { defaultValue: Schema } }
	| {
			type: 'replace';
			scope: string;
			payload: { defaultValue: Schema; index: number };
	  }
	| { type: 'remove'; scope: string; payload: { index: number } }
	| { type: 'reorder'; scope: string; payload: { from: number; to: number } };

export function parseListCommand<Schema = unknown>(
	data: string,
): ListCommand<Schema> {
	try {
		const command = JSON.parse(data);

		if (
			typeof command.type !== 'string' ||
			![
				'prepend',
				'append',
				'replace',
				'remove',
				'reorder',
				'combine',
			].includes(command.type)
		) {
			throw new Error(`Unknown list command received: ${command.type}`);
		}

		return command;
	} catch (error) {
		throw new Error(`Invalid list command: "${data}"; ${error}`);
	}
}

export function updateList<Schema>(
	list: Array<Schema>,
	command: ListCommand<Schema>,
): Array<Schema> {
	switch (command.type) {
		case 'prepend': {
			list.unshift(command.payload.defaultValue);
			break;
		}
		case 'append': {
			list.push(command.payload.defaultValue);
			break;
		}
		case 'replace': {
			list.splice(command.payload.index, 1, command.payload.defaultValue);
			break;
		}
		case 'remove':
			list.splice(command.payload.index, 1);
			break;
		case 'reorder':
			list.splice(
				command.payload.to,
				0,
				...list.splice(command.payload.from, 1),
			);
			break;
		default:
			throw new Error('Unknown list command received');
	}

	return list;
}

export function handleList<Schema>(
	submission: Submission<Schema>,
): Submission<Schema> {
	if (submission.type !== 'list') {
		return submission;
	}

	const command = parseListCommand(submission.intent ?? '');
	const paths = getPaths(command.scope);

	setValue(submission.value, paths, (list) => {
		if (typeof list !== 'undefined' && !Array.isArray(list)) {
			throw new Error('The list command can only be applied to a list');
		}

		return updateList(list ?? [], command);
	});

	return submission;
}

export interface ListCommandButtonBuilder {
	append<Schema>(
		name: string,
		payload?: { defaultValue: Schema },
	): CommandButtonProps<'list'>;
	prepend<Schema>(
		name: string,
		payload?: { defaultValue: Schema },
	): CommandButtonProps<'list'>;
	replace<Schema>(
		name: string,
		payload: { defaultValue: Schema; index: number },
	): CommandButtonProps<'list'>;
	remove(name: string, payload: { index: number }): CommandButtonProps<'list'>;
	reorder(
		name: string,
		payload: { from: number; to: number },
	): CommandButtonProps<'list'>;
}

/**
 * Helpers to configure a command button for modifying a list
 *
 * @see https://conform.guide/api/react#list
 */
export const list = new Proxy({} as ListCommandButtonBuilder, {
	get(_target, type: any) {
		switch (type) {
			case 'append':
			case 'prepend':
			case 'replace':
			case 'remove':
			case 'reorder':
				return (scope: string, payload = {}) => {
					return {
						name: 'conform/list',
						value: JSON.stringify({ type, scope, payload }),
						formNoValidate: true,
					};
				};
		}
	},
});
