/**
 *
 */
export type Constraint<Type> = (undefined extends Type
	? { required?: false }
	: { required: true }) &
	(Type extends Array<any> ? { multiple: true } : { multiple?: false }) &
	(Type extends string | number | Date
		? {
				required?: boolean;
				minLength?: number;
				maxLength?: number;
				min?: string;
				max?: string;
				step?: string;
				multiple?: boolean;
				pattern?: string;
		  }
		: {});

/**
 *
 */
export interface FieldConfig<Type = any> {
	name: string;
	value?: FieldsetData<Type, string>;
	error?: FieldsetData<Type, string>;
	form?: string;
	constraint?: Constraint<Type>;
}

/**
 *
 */
export type Schema<Type extends Record<string, any>> = {
	constraint: { [Key in keyof Type]-?: Constraint<Type[Key]> };
	validate?: (element: FieldsetElement) => void;
};

/**
 * Data structure of the form value
 */
export type FieldsetData<Type, Value> = Type extends string | number | Date
	? Value
	: Type extends Array<infer InnerType>
	? Array<FieldsetData<InnerType, Value>>
	: Type extends Object
	? { [Key in keyof Type]: FieldsetData<Type[Key], Value> }
	: never;

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

/**
 *
 * @param element
 * @returns
 */
export function isFieldsetElement(
	element: unknown,
): element is FieldsetElement {
	return (
		element instanceof Element &&
		(element.tagName.toLowerCase() === 'FORM' ||
			element.tagName.toLowerCase() === 'FIELDSET')
	);
}

/**
 *
 * @param element
 * @returns
 */
export function isFieldElement(element: unknown): element is FieldElement {
	return (
		element instanceof Element &&
		(element.tagName === 'INPUT' ||
			element.tagName === 'SELECT' ||
			element.tagName === 'TEXTAREA' ||
			element.tagName === 'BUTTON')
	);
}

/**
 *
 * @param field
 * @param state
 * @returns
 */
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

/**
 *
 * @param fieldset
 * @returns
 */
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

/**
 *
 * @param schema
 * @param options
 * @returns
 */
export function createFieldConfig<Type extends Record<string, any>>(
	schema: Schema<Type>,
	options: {
		name?: string;
		form?: string;
		value?: FieldsetData<Type, string>;
		error?: FieldsetData<Type, string>;
	},
): { [Key in keyof Type]-?: FieldConfig<Type[Key]> } {
	const result: { [Key in keyof Type]-?: FieldConfig<Type[Key]> } = {} as any;

	for (const key of Object.keys(schema.constraint)) {
		const constraint = schema.constraint[key];
		const config: FieldConfig<any> = {
			name: options.name ? `${options.name}.${key}` : key,
			form: options.form,
			value: options.value?.[key],
			error: options.error?.[key],
			// @ts-expect-error
			constraint,
		};

		result[key as keyof Type] = config;
	}

	return result;
}

/**
 *
 * @param event
 * @returns
 */
export function shouldSkipValidate(event: SubmitEvent): boolean {
	if (
		event.submitter?.tagName === 'button' ||
		event.submitter?.tagName === 'input'
	) {
		return (event.submitter as HTMLButtonElement | HTMLInputElement)
			.formNoValidate;
	}

	return false;
}

/**
 *
 * @param name
 * @returns
 */
export function getPaths(name: string): Array<string | number> {
	const pattern = /(\w+)\[(\d+)\]/;

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

/**
 *
 * @param entries
 * @returns
 */
export function unflatten<T>(
	entries: Array<[string, T]> | Iterable<[string, T]>,
): any {
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

/**
 *
 * @param fieldset
 * @param key
 * @returns
 */
export function getFields(
	fieldset: FieldsetElement,
	key: string,
): FieldElement[] {
	const name = fieldset.name ? `${fieldset.name}.${key}` : key;
	const item = fieldset.elements.namedItem(name);
	const nodes =
		item instanceof RadioNodeList
			? Array.from(item)
			: item !== null
			? [item]
			: [];

	return nodes.filter(isFieldElement);
}
