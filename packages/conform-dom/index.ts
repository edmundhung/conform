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

export interface FormState<Schema extends Record<string, any>> {
	value: FieldValue<Schema>;
	error: Array<[string, string]>;
	scope?: string[];
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

export function getPaths(name?: string): Array<string | number> {
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

export function getKey(
	fieldName: string,
	fieldsetName: string = '',
): string | null {
	const name =
		fieldsetName === '' || fieldName.startsWith(fieldsetName)
			? fieldName.slice(fieldsetName ? fieldsetName.length + 1 : 0)
			: '';
	const paths = getPaths(name);

	if (paths.length > 1) {
		return null;
	}

	return typeof paths[0] === 'string' ? paths[0] : null;
}

export function setFormError(
	form: HTMLFormElement,
	error: Array<[string, string]>,
	scope?: string[],
) {
	const firstErrorByName = Object.fromEntries([...error].reverse());

	for (const element of form.elements) {
		if (!isFieldElement(element) || (scope && !scope.includes(element.name))) {
			continue;
		}

		element.setCustomValidity(firstErrorByName[element.name] ?? '');
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

export function unflatten(
	entries:
		| Array<[string, FormDataEntryValue]>
		| Iterable<[string, FormDataEntryValue]>,
): Record<string, unknown> {
	const result: any = {};

	for (let [key, value] of entries) {
		let paths = getPaths(key);

		setValue(result, paths, (prev) => {
			if (prev) {
				throw new Error('Entry with the same name is not supported');
			}

			return value;
		});
	}

	return result;
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
	scope?: string[],
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
				(!scope || scope.includes(field.name))
			) {
				field.focus();
				break;
			}
		}
	}
}

export function parse(
	payload: FormData | URLSearchParams,
): FormState<Record<string, unknown>> {
	let state: FormState<Record<string, unknown>> = {
		value: {},
		error: [],
	};

	try {
		let controlButtonValue = payload.get(controlButtonName);

		if (controlButtonValue) {
			if (controlButtonValue instanceof File) {
				throw new Error(
					`The "${controlButtonName}" name could not be used for file upload`,
				);
			}

			payload.delete(controlButtonName);
		}

		const command = controlButtonValue
			? parseCommand(controlButtonValue)
			: null;

		state.value = unflatten(payload.entries());

		if (!command) {
			state.scope = Array.from(payload.keys());
		} else {
			if (isListCommand(command)) {
				state = applyListCommand(state, command);
			} else {
				state.error.push(['', 'Unknown command provided']);
			}
		}
	} catch (e) {
		state.error.push([
			'',
			e instanceof Error ? e.message : 'Failed parsing the provided payload',
		]);
	}

	return state;
}

export type Command = {
	type: string;
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

export const controlButtonName = '__conform__';

export function parseCommand<Command extends { type: Type }, Type = string>(
	serialized: string,
): Command | null {
	try {
		const command = JSON.parse(serialized);

		if (typeof command.type !== 'string') {
			throw new Error('Invalid command');
		}

		return command;
	} catch (e) {
		return null;
	}
}

export function updateList<Type>(
	list: Array<Type>,
	command: ListCommand<Type>,
): Array<Type> {
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
			throw new Error('Invalid list command');
	}

	return list;
}

export function isListCommand(command: Command): command is ListCommand {
	return ['prepend', 'append', 'replace', 'remove', 'reorder'].includes(
		command.type,
	);
}

export function applyListCommand<Schema extends Record<string, unknown>>(
	state: FormState<Schema>,
	command: ListCommand,
): FormState<Schema> {
	const paths = getPaths(command.scope);
	const value = state.value;

	setValue(value, paths, (list) => {
		if (!Array.isArray(list)) {
			throw new Error('The list command can only be applied to a list');
		}

		return updateList(list, command);
	});

	return {
		value,
		error: [...state.error, [controlButtonName, 'List modified']],
		scope: [],
	};
}
