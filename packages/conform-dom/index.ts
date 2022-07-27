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
export type FieldsetData<Type, Value> = Type extends
	| string
	| number
	| Date
	| boolean
	| undefined
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

export interface ControlButtonProps {
	type: 'submit';
	name: string;
	value: string;
	formNoValidate: boolean;
}

export interface ControlAction<T = unknown> {
	prepend: { defaultValue: T };
	append: { defaultValue: T };
	replace: { defaultValue: T; index: number };
	remove: { index: number };
	reorder: { from: number; to: number };
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

	return transform(entries);
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

export function transform(
	entries:
		| Array<[string, FormDataEntryValue]>
		| Iterable<[string, FormDataEntryValue]>,
): Record<string, unknown> {
	const result: any = {};

	for (let [key, value] of entries) {
		if (value === '') {
			continue;
		}

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

			// if (typeof pointer[key] !== 'undefined') {
			// 	pointer[key] = Array.isArray(pointer[key])
			// 		? pointer[key].concat(newValue)
			// 		: [pointer[key], newValue];
			// } else {
			pointer[key] = newValue;
			// }

			pointer = pointer[key];
		}
	}

	return result;
}

export function getControlButtonProps<
	Action extends keyof ControlAction,
	Payload extends ControlAction[Action],
>(name: string, action: Action, payload: Payload): ControlButtonProps {
	return {
		type: 'submit',
		name: '__conform__',
		value: [name, action, JSON.stringify(payload)].join('::'),
		formNoValidate: true,
	};
}

export function applyControlCommand<
	Type,
	Action extends keyof ControlAction<Type>,
	Payload extends ControlAction<Type>[Action],
>(list: Array<Type>, action: Action | string, payload: Payload): Array<Type> {
	switch (action) {
		case 'prepend': {
			const { defaultValue } = payload as ControlAction<Type>['prepend'];
			list.unshift(defaultValue);
			break;
		}
		case 'append': {
			const { defaultValue } = payload as ControlAction<Type>['append'];
			list.push(defaultValue);
			break;
		}
		case 'replace': {
			const { defaultValue, index } = payload as ControlAction<Type>['replace'];
			list.splice(index, 1, defaultValue);
			break;
		}
		case 'remove':
			const { index } = payload as ControlAction<Type>['remove'];
			list.splice(index, 1);
			break;
		case 'reorder':
			const { from, to } = payload as ControlAction<Type>['reorder'];
			list.splice(to, 0, ...list.splice(from, 1));
			break;
		default:
			throw new Error('Invalid action found');
	}

	return list;
}

export function parse(
	payload: FormData | URLSearchParams,
): Submission<Record<string, unknown>> {
	const command = payload.get('__conform__');

	if (command) {
		payload.delete('__conform__');
	}

	const value = transform(payload.entries());

	if (command) {
		try {
			if (command instanceof File) {
				throw new Error(
					'The __conform__ key is reserved for special command and could not be used for file upload.',
				);
			}

			const [name, action, json] = command.split('::');

			let list: any = value;

			for (let path of getPaths(name)) {
				list = list[path];

				if (typeof list === 'undefined') {
					break;
				}
			}

			if (!Array.isArray(list)) {
				throw new Error('');
			}

			applyControlCommand(list, action, JSON.parse(json));
		} catch (e) {
			return {
				state: 'rejected',
				form: {
					value,
					error: {
						__conform__:
							e instanceof Error ? e.message : 'Something went wrong',
					},
				},
			};
		}

		return {
			state: 'modified',
			form: {
				value,
				error: {},
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
