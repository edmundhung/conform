export type Primitive = null | undefined | string | number | boolean | Date;

export type Constraint = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: string | number;
	max?: string | number;
	step?: string;
	multiple?: boolean;
	pattern?: string;
};

export interface FieldProps<Type = any> extends Constraint {
	name: string;
	defaultValue?: FieldsetData<Type, string>;
	error?: FieldsetData<Type, string>;
	form?: string;
}

export type Schema<Type extends Record<string, any>> = {
	fields: { [Key in keyof Type]-?: Constraint };
	validate?: (element: HTMLFieldSetElement) => void;
};

/**
 * Data structure of the form value
 */
export type FieldsetData<Type, Value> = Type extends Primitive
	? Value
	: Type extends Array<infer InnerType>
	? Array<FieldsetData<InnerType, Value>>
	: Type extends Object
	? { [Key in keyof Type]?: FieldsetData<Type[Key], Value> }
	: unknown;

/**
 * Element type that might be a candiate of Constraint Validation
 */
export type FieldElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
	| HTMLButtonElement;

export interface FormState<T> {
	value: FieldsetData<T, string>;
	error: FieldsetData<T, string>;
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

export function setFieldState(
	field: unknown,
	state: { touched: boolean },
): void {
	if (!isFieldElement(field)) {
		return;
	}

	if (state.touched) {
		field.dataset.touched = 'true';
	} else {
		delete field.dataset.touched;
	}
}

export function reportValidity(fieldset: HTMLFormElement): boolean {
	let isValid = true;

	for (const field of fieldset.elements) {
		if (
			isFieldElement(field) &&
			field.dataset.touched &&
			!field.checkValidity()
		) {
			isValid = false;
		}
	}

	return isValid;
}

export function getFieldProps<Type extends Record<string, any>>(
	schema: Schema<Type>,
	options: {
		name?: string;
		form?: string;
		defaultValue?: FieldsetData<Type, string>;
		error?: FieldsetData<Type, string>;
	},
): { [Key in keyof Type]-?: FieldProps<Type[Key]> } {
	const result: { [Key in keyof Type]-?: FieldProps<Type[Key]> } = {} as any;

	for (const key of Object.keys(schema.fields)) {
		const constraint = schema.fields[key];
		const props: FieldProps<any> = {
			name: options.name ? `${options.name}.${key}` : key,
			form: options.form,
			defaultValue: options.defaultValue?.[key],
			error: options.error?.[key],
			...constraint,
		};

		result[key as keyof Type] = props;
	}

	return result;
}

export function shouldSkipValidate(event: SubmitEvent): boolean {
	if (
		event.submitter?.tagName === 'BUTTON' ||
		event.submitter?.tagName === 'INPUT'
	) {
		return (event.submitter as HTMLButtonElement | HTMLInputElement)
			.formNoValidate;
	}

	return false;
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

export function getFieldsetData(
	fieldset: HTMLFieldSetElement,
): FieldsetData<Record<string, unknown>, string> {
	const entries: Array<[string, FormDataEntryValue]> = [];

	if (fieldset.form) {
		const formData = new FormData(fieldset.form);

		for (const [key, value] of formData) {
			if (!fieldset.name || key.startsWith(`${fieldset.name}.`)) {
				entries.push([
					key.slice(fieldset.name ? fieldset.name.length + 1 : 0),
					value,
				]);
			}
		}
	}

	return unflatten(entries);
}

export function setFieldsetError(
	fieldset: HTMLFieldSetElement,
	keys: string[],
	errors: Array<[string, string]>,
) {
	const firstErrorByName = Object.fromEntries([...errors].reverse());

	for (const element of fieldset.elements) {
		if (!isFieldsetField(fieldset, keys, element)) {
			continue;
		}

		element.setCustomValidity(firstErrorByName[element.name] ?? '');
	}
}

export function isFieldsetField(
	fieldset: HTMLFieldSetElement,
	keys: string[],
	element: unknown,
): element is FieldElement {
	return (
		isFieldElement(element) &&
		element.form === fieldset.form &&
		keys.some((key) => element.name.startsWith(getName([fieldset.name, key])))
	);
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
		let length = paths.length;
		let lastIndex = length - 1;
		let index = -1;
		let pointer = result;

		while (pointer != null && ++index < length) {
			let key = paths[index];
			let next = paths[index + 1];
			let newValue = value;

			if (index != lastIndex) {
				newValue = pointer[key] ?? (typeof next === 'number' ? [] : {});
			}

			pointer[key] = newValue;
			pointer = pointer[key];
		}
	}

	return result;
}

export function parse(
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
					error: {},
				},
			};
		}
	} catch (e) {
		return {
			state: 'rejected',
			form: {
				value,
				error: {
					__conform__: e instanceof Error ? e.message : 'Submission failed',
				},
			},
		};
	}

	return {
		state: 'accepted',
		data: value,
		form: {
			value,
			error: {},
		},
	};
}

/**
 * Lookup the corresponding element based on fieldset name and key
 * @deprecated
 */
export function getFieldElements(
	fieldset: HTMLFieldSetElement,
	key: string,
): FieldElement[] {
	const name = getName([fieldset.name ?? '', key]);
	const item = fieldset.elements.namedItem(name);
	const nodes =
		item instanceof RadioNodeList
			? Array.from(item)
			: item !== null
			? [item]
			: [];

	return nodes.filter(isFieldElement);
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
