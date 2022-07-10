export type Constraint = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: string;
	max?: string;
	step?: string;
	multiple?: boolean;
	pattern?: string;
};

export interface FieldConfig<Type = any> {
	name: string;
	initialValue?: FieldsetData<Type, string>;
	error?: FieldsetData<Type, string>;
	form?: string;
	constraint?: Constraint;
}

export type Schema<Type extends Record<string, any>> = {
	fields: { [Key in keyof Type]-?: Constraint };
	validate?: (element: FieldsetElement) => void;
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
 * Element that maintains a list of fields
 * i.e. fieldset.elements
 */
export type FieldsetElement = HTMLFormElement | HTMLFieldSetElement;

/**
 * Element type that might be a candiate of Constraint Validation
 */
export type FieldElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
	| HTMLButtonElement;

export type FormResult<T> =
	| {
			state: 'processed';
			value: FieldsetData<T, string> | null;
			error: FieldsetData<T, string> | null;
	  }
	| {
			state: 'rejected';
			value: FieldsetData<T, string> | null;
			error: FieldsetData<T, string>;
	  }
	| {
			state: 'accepted';
			value: T;
	  };

export function isFieldsetElement(
	element: unknown,
): element is FieldsetElement {
	return (
		element instanceof Element &&
		(element.tagName === 'FORM' || element.tagName === 'FIELDSET')
	);
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
	if (isFieldsetElement(field)) {
		for (let element of field.elements) {
			setFieldState(element, state);
		}
		return;
	}

	if (!isFieldElement(field)) {
		console.warn('Only input/select/textarea/button element can be touched');
		return;
	}

	if (state.touched) {
		field.dataset.touched = 'true';
	} else {
		delete field.dataset.touched;
	}
}

export function reportValidity(fieldset: FieldsetElement): boolean {
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

export function createFieldConfig<Type extends Record<string, any>>(
	schema: Schema<Type>,
	options: {
		name?: string;
		form?: string;
		initialValue?: FieldsetData<Type, string>;
		error?: FieldsetData<Type, string>;
	},
): { [Key in keyof Type]-?: FieldConfig<Type[Key]> } {
	const result: { [Key in keyof Type]-?: FieldConfig<Type[Key]> } = {} as any;

	for (const key of Object.keys(schema.fields)) {
		const constraint = schema.fields[key];
		const config: FieldConfig<any> = {
			name: options.name ? `${options.name}.${key}` : key,
			form: options.form,
			initialValue: options.initialValue?.[key],
			error: options.error?.[key],
			constraint,
		};

		result[key as keyof Type] = config;
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

export function transform(
	entries:
		| Array<[string, FormDataEntryValue]>
		| Iterable<[string, FormDataEntryValue]>,
): unknown {
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

export function createControlButton(
	name: string,
	action: 'prepend' | 'append' | 'remove',
	data: any,
): {
	type: 'submit';
	name: string;
	value: string;
	formNoValidate: boolean;
} {
	return {
		type: 'submit',
		name: '__conform__',
		value: [name, action, JSON.stringify(data)].join('::'),
		formNoValidate: true,
	};
}

export function parse(
	payload: FormData | URLSearchParams,
): FormResult<unknown> {
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

			switch (action) {
				case 'prepend': {
					const initialValue = JSON.parse(json);

					list.unshift(initialValue);
					break;
				}
				case 'append': {
					const initialValue = JSON.parse(json);

					list.push(initialValue);
					break;
				}
				case 'remove':
					const { index } = JSON.parse(json);

					list.splice(index, 1);
					break;
				default:
					throw new Error(
						'Invalid action found; Only `prepend`, `append` and `remove` is accepted',
					);
			}
		} catch (e) {
			return {
				state: 'rejected',
				value,
				error: {
					__conform__: e instanceof Error ? e.message : 'Something went wrong',
				},
			};
		}

		return {
			state: 'processed',
			value,
			error: null,
		};
	}

	return {
		state: 'accepted',
		value,
	};
}

export function getFieldElements(
	fieldset: FieldsetElement,
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
