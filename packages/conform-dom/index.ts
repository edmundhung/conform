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

export type Schema<Shape extends Record<string, any>, Source> = {
	source: Source;
	constraint: FieldsetConstraint<Shape>;
	validate: (
		element: HTMLFormElement,
		submitter?: HTMLInputElement | HTMLButtonElement | null,
	) => void;
	parse: (payload: FormData | URLSearchParams) => Submission<Shape>;
};

export interface FormState<Schema extends Record<string, any>> {
	value: FieldValue<Schema>;
	error: Array<[string, string]>;
}

export type Submission<T extends Record<string, unknown>> =
	| {
			state: 'modified';
			form: FormState<T>;
	  }
	| {
			state: 'rejected';
			form: FormState<T>;
	  }
	| {
			state: 'accepted';
			data: T;
			form: FormState<T>;
	  };

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
	const pattern = /(\w+)\[(\d+)\]/;

	if (!name) {
		return [];
	}

	return name.split('.').flatMap((key) => {
		const matches = pattern.exec(key);

		if (!matches) {
			return key;
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
		if (name === '' || path === '') {
			return [name, path].join('');
		}

		if (typeof path === 'number') {
			return `${name}[${path}]`;
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
	errors: Array<[string, string]>,
) {
	const firstErrorByName = Object.fromEntries([...errors].reverse());

	for (const element of form.elements) {
		if (!isFieldElement(element)) {
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

export function flatten(
	data: unknown,
	prefix = '',
): Array<[string, FormDataEntryValue]> {
	let entries: Array<[string, FormDataEntryValue]> = [];

	if (
		typeof data === 'string' ||
		typeof data === 'undefined' ||
		data instanceof File
	) {
		entries.push([prefix, data ?? '']);
	} else if (Array.isArray(data)) {
		for (let i = 0; i < data.length; i++) {
			entries.push(...flatten(data[i], `${prefix}[${i}]`));
		}
	} else {
		for (const [key, value] of Object.entries(Object(data))) {
			entries.push(...flatten(value, prefix ? `${prefix}.${key}` : key));
		}
	}

	return entries;
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

export function createSubmission(
	payload: FormData | URLSearchParams,
): Submission<Record<string, unknown>> {
	let value: Record<string, unknown> = {};

	try {
		const modifiedPayload = applyListCommand(payload);
		value = unflatten(modifiedPayload.entries());

		if (payload !== modifiedPayload) {
			return {
				state: 'modified',
				form: {
					value,
					error: [],
				},
			};
		}
	} catch (e) {
		return {
			state: 'rejected',
			form: {
				value,
				error: [['', e instanceof Error ? e.message : 'Submission failed']],
			},
		};
	}

	return {
		state: 'accepted',
		data: value,
		form: {
			value,
			error: [],
		},
	};
}

export function createValidate(
	handler: (
		field:
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLButtonElement,
		formData: FormData,
	) => void,
): (
	form: HTMLFormElement,
	submitter?: HTMLInputElement | HTMLButtonElement | null,
) => void {
	return (form, submitter) => {
		const formData = getFormData(form, submitter);

		for (const field of form.elements) {
			if (isFieldElement(field)) {
				handler(field, formData);
			}
		}
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

export type ListCommand<Schema> =
	| { type: 'prepend'; payload: { defaultValue: Schema } }
	| { type: 'append'; payload: { defaultValue: Schema } }
	| { type: 'replace'; payload: { defaultValue: Schema; index: number } }
	| { type: 'remove'; payload: { index: number } }
	| { type: 'reorder'; payload: { from: number; to: number } };

export const listCommandKey = '__conform__';

export function serializeListCommand<Schema>(
	name: string,
	{ type, payload }: ListCommand<Schema>,
): string {
	return [name, type, JSON.stringify(payload)].join('::');
}

export function parseListCommand<Schema>(
	serialized: string,
): [string, ListCommand<Schema>] {
	const [name, type, json] = serialized.split('::');

	return [name, { type: type as any, payload: JSON.parse(json) }];
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

export function applyListCommand(
	payload: FormData | URLSearchParams,
): FormData | URLSearchParams {
	const command = payload.get(listCommandKey);

	if (!command) {
		return payload;
	}

	payload.delete(listCommandKey);

	if (command instanceof File) {
		throw new Error(
			`The "${listCommandKey}" key could not be used for file upload`,
		);
	}

	const result = new FormData();
	const entries: Array<[string, FormDataEntryValue]> = [];
	const [key, listCommand] = parseListCommand(command);

	for (const [name, value] of payload) {
		if (name.startsWith(key)) {
			entries.push([name.replace(key, 'list'), value]);
		} else {
			result.append(name, value);
		}
	}

	const { list } = unflatten(entries);

	if (!Array.isArray(list)) {
		throw new Error('The list command can only be applied to a list');
	}

	updateList(list, listCommand);

	for (const [name, value] of flatten(list, key)) {
		result.append(name, value);
	}

	return result;
}
