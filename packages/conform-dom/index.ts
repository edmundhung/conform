/**
 *
 */
export interface Constraint {
	required: boolean;
	minLength: number;
	maxLength: number;
	min: string;
	max: string;
	step: string;
	multiple: boolean;
	pattern: string;
}

/**
 *
 */
export interface FieldConfig<Type = any> {
	name: string;
	value?: FieldsetValue<Type>;
	error?: FieldsetError<Type>;
	form?: string;
	constraint?: Partial<Constraint>;
}

/**
 *
 */
export type Schema<Type extends Record<string, any>> = {
	validate: (value: FieldsetValue<Type>) => FieldsetError<Type>;
	config: {
		[Key in keyof Type]: {
			constraint?: Partial<Constraint>;
			validate(value: FieldsetValue<Type[Key]>): FieldsetError<Type[Key]>;
			getValidationMessage?: (
				validationMessage: string,
				validity: ValidityState,
			) => string;
		};
	};
};

/**
 * Data structure of the form value
 */
export type FieldsetValue<Type> = Type extends string | number | Date
	? string
	: Type extends Array<infer InnerType>
	? Array<FieldsetValue<InnerType>>
	: Type extends Object
	? { [Key in keyof Type]: FieldsetValue<Type[Key]> }
	: never;

/**
 * Data structure of the error
 */
export type FieldsetError<Type> = Type extends string | number | Date
	? Array<string>
	: Type extends Array<infer InnerType>
	? Array<FieldsetError<InnerType>>
	: Type extends Object
	? { [Key in keyof Type]: FieldsetError<Type[Key]> }
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
 * @param tag
 * @returns
 */
function isElement<T extends HTMLElement>(
	element: any,
	tag: string,
): element is T {
	return !!element && element.tagName?.toLowerCase() === tag;
}

/**
 *
 * @param element
 * @returns
 */
export function isFieldsetElement(
	element: unknown,
): element is FieldsetElement {
	return (
		isElement<HTMLInputElement>(element, 'form') ||
		isElement<HTMLSelectElement>(element, 'fieldset')
	);
}

/**
 *
 * @param element
 * @returns
 */
export function isFieldElement(element: unknown): element is FieldElement {
	return (
		isElement<HTMLInputElement>(element, 'input') ||
		isElement<HTMLSelectElement>(element, 'select') ||
		isElement<HTMLTextAreaElement>(element, 'textarea') ||
		isElement<HTMLButtonElement>(element, 'button')
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
		if (isFieldElement(field) && field.dataset.touched) {
			isValid = isValid && field.reportValidity();
		}
	}

	return isValid;
}

/**
 *
 * @param fieldset
 * @param schema
 * @param options
 * @returns
 */
export function getFieldElementsEntries<Type extends Record<string, any>>(
	fieldset: FieldsetElement,
	schema: Schema<Type>,
	options: {
		name?: string;
	},
): Array<[string, FieldElement | FieldElement[] | null]> {
	const entries: Array<[string, FieldElement | FieldElement[] | null]> = [];

	for (let key of Object.keys(schema.config)) {
		let item = fieldset.elements.namedItem(
			options.name ? `${options.name}.${key}` : key,
		);
		let element: FieldElement | FieldElement[] | null = null;

		if (item instanceof RadioNodeList) {
			element = Array.from(item).filter(isFieldElement);
		} else if (isFieldElement(item)) {
			element = item;
		}

		entries.push([key, element]);
	}

	return entries;
}

/**
 *
 * @param fieldset
 * @param schema
 * @param options
 */
export function validate<Type extends Record<string, any>>(
	fieldset: HTMLFormElement | HTMLFieldSetElement,
	schema: Schema<Type>,
	options: {
		name?: string;
	},
): void {
	const entries = getFieldElementsEntries(fieldset, schema, options);
	const value: Record<string, string | string[] | null> = {};

	for (let [key, field] of entries) {
		let fieldValue: string | string[] | null = null;

		if (Array.isArray(field)) {
			fieldValue = field.map((el) => el.value);
		} else if (field) {
			fieldValue = field.value;
		}

		value[key] = fieldValue;
	}

	const error = schema.validate(value as FieldsetValue<Type>);

	console.log('validate', { value, error });

	// for (let [key, field] of entries) {
	//     if (Array.isArray(field)) {
	//         for (let el of field) {
	//             el.setCustomValidity()
	//         }
	//     } else if (field) {
	//         field.setCustomValidity(error[key] ?? '');
	//     }
	// }
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
		value?: FieldsetValue<Type>;
		error?: FieldsetError<Type>;
	},
): { [Key in keyof Type]: FieldConfig<Type[Key]> } {
	const result: { [Key in keyof Type]: FieldConfig<Type[Key]> } = {} as any;

	for (const key of Object.keys(schema.config)) {
		const field = schema.config[key];
		const config: FieldConfig = {
			name: options.name ? `${options.name}.${key}` : key,
			form: options.form,
			value: options.value?.[key],
			error: options.error?.[key],
			constraint: field.constraint,
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
		!isElement<HTMLButtonElement>(event.submitter, 'button') &&
		!isElement<HTMLInputElement>(event.submitter, 'input')
	) {
		return false;
	}

	return event.submitter.formNoValidate;
}
