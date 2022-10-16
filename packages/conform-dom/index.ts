export type Primitive = null | undefined | string | number | boolean | Date;

export type FieldElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
	| HTMLButtonElement;

export interface FieldConfig<Schema = unknown> extends FieldConstraint {
	name: string;
	defaultValue?: FieldValue<Schema>;
	initialError?: Array<[string, string]>;
	form?: string;
}

export type FieldValue<Schema> = Schema extends Primitive | File
	? string
	: Schema extends Array<infer InnerType>
	? Array<FieldValue<InnerType>>
	: Schema extends Record<string, any>
	? { [Key in keyof Schema]?: FieldValue<Schema[Key]> }
	: unknown;

export type FieldConstraint = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: string | number;
	max?: string | number;
	step?: string;
	multiple?: boolean;
	pattern?: string;
};

export type FieldsetConstraint<Schema extends Record<string, any>> = {
	[Key in keyof Schema]?: FieldConstraint;
};

export interface SubmissionStatus<Schema = unknown> {
	scope: string[];
	value: FieldValue<Schema>;
	error: Array<[string, string]>;
}

export interface Submission<Schema = unknown> extends SubmissionStatus<Schema> {
	type?: string;
	data?: string;
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

export function hasError(
	error: Array<[string, string]>,
	name: string,
): boolean {
	return (
		typeof error.find(
			([fieldName, message]) => fieldName === name && message !== '',
		) !== 'undefined'
	);
}

export function reportValidity(
	form: HTMLFormElement,
	result: SubmissionStatus,
): boolean {
	const firstErrorByName = Object.fromEntries([...result.error].reverse());

	for (const element of form.elements) {
		if (!isFieldElement(element) || !result.scope.includes(element.name)) {
			continue;
		}

		element.setCustomValidity(firstErrorByName[element.name] ?? '');
	}

	return form.reportValidity();
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

export function requestValidate(form: HTMLFormElement, field?: string) {
	const button = document.createElement('button');

	button.name = 'conform/validate';
	button.value = field ?? '';
	button.hidden = true;

	form.appendChild(button);
	requestSubmit(form, button);
	form.removeChild(button);
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

export function focusFirstInvalidField(
	form: HTMLFormElement,
	fields?: string[],
): void {
	const currentFocus = document.activeElement;

	if (
		!isFieldElement(currentFocus) ||
		currentFocus.tagName !== 'BUTTON' ||
		currentFocus.form !== form
	) {
		return;
	}

	for (const field of form.elements) {
		if (isFieldElement(field)) {
			// Focus on the first non button field
			if (
				!field.validity.valid &&
				field.dataset.conformTouched &&
				field.tagName !== 'BUTTON' &&
				(!fields || fields.includes(field.name))
			) {
				field.focus();
				break;
			}
		}
	}
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
	let submission: Submission<Record<string, unknown>> = {
		value: {},
		error: [],
		scope: [''],
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

				if (typeof submission.type !== 'undefined') {
					throw new Error('The conform command could only be set on a button');
				}

				submission.type = submissionType;
				submission.data = value;
			} else {
				const paths = getPaths(name);
				const scopes = paths.reduce<string[]>((result, path) => {
					if (result.length === 0) {
						if (typeof path !== 'string') {
							throw new Error(`Invalid name received: ${name}`);
						}

						result.push(path);
					} else {
						const [lastName] = result.slice(-1);
						result.push(getName([lastName, path]));
					}

					return result;
				}, []);

				submission.scope.push(...scopes);

				setValue(submission.value, paths, (prev) => {
					if (prev) {
						throw new Error('Entry with the same name is not supported');
					}

					return value;
				});
			}
		}

		switch (submission.type) {
			case 'validate':
				if (typeof submission.data !== 'undefined' && submission.data !== '') {
					submission.scope = [submission.data];
				}
				break;
			case 'list':
				submission = handleList(submission);
				break;
		}
	} catch (e) {
		submission.error.push([
			'',
			e instanceof Error ? e.message : 'Invalid payload received',
		]);
	}

	// Remove duplicates
	submission.scope = Array.from(new Set(submission.scope));

	return submission as Submission<Schema>;
}

export type Command = {
	name: string;
	value: string;
};

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

export function parseListCommand<Type = unknown>(
	data: string | undefined,
): ListCommand<Type> {
	try {
		const command = JSON.parse(data ?? '');

		if (
			typeof command.type !== 'string' ||
			!['prepend', 'append', 'replace', 'remove', 'reorder'].includes(
				command.type,
			)
		) {
			throw new Error('Unsupported list command type');
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
): SubmissionStatus<Schema> {
	const command = parseListCommand(submission.data);
	const paths = getPaths(command.scope);

	setValue(submission.value, paths, (list) => {
		if (!Array.isArray(list)) {
			throw new Error('The list command can only be applied to a list');
		}

		return updateList(list, command);
	});

	return {
		...submission,
		scope: [command.scope],
	};
}
