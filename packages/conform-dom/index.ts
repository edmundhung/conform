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
	validate: (
		value: FieldsetData<Type, string>,
		validity: FieldsetData<Type, ValidityState>,
	) => Record<keyof Type, string>;
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
		(element.tagName.toLowerCase() === 'form' ||
			element.tagName.toLowerCase() === 'fieldset')
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
		(element.tagName === 'input' ||
			element.tagName === 'select' ||
			element.tagName === 'textarea' ||
			element.tagName === 'button')
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
 */
export function validate<Type extends Record<string, any>>(
	fieldset: HTMLFormElement | HTMLFieldSetElement,
	schema: Schema<Type>,
	options: {
		name?: string;
	},
): void {
	const nodesByKey: Record<string, Node[]> = {};
	const value: Record<string, string | string[] | null> = {};
	const validity: Record<string, ValidityState | ValidityState[] | null> = {};

	for (let key of Object.keys(schema.constraint)) {
		const constraint = schema.constraint[key];
		const name = options.name ? `${options.name}.${key}` : key;
		const item = fieldset.elements.namedItem(name);

		const nodes: Node[] = [];
		const fieldValue: string[] = [];
		const fieldValidity: ValidityState[] = [];

		if (item instanceof RadioNodeList) {
			if (!constraint.multiple) {
				console.warn('Multiple is set to false but received multiple nodes');
			}

			nodes.push(...Array.from(item));
		} else if (isFieldElement(item)) {
			nodes.push(item);
		}

		for (const node of nodes) {
			if (!isFieldElement(node)) {
				console.warn(`Unexpected element with key "${key}"; Received`, node);
				continue;
			}

			fieldValue.push(node.value);
			fieldValidity.push(node.validity);
		}

		if (constraint.multiple) {
			value[key] = fieldValue;
			validity[key] = fieldValidity;
		} else {
			value[key] = fieldValue[0] ?? null;
			validity[key] = fieldValidity[0] ?? null;
		}

		nodesByKey[key] = nodes;
	}

	const error = schema.validate(
		value as FieldsetData<Type, string>,
		validity as FieldsetData<Type, ValidityState>,
	);

	for (let [key, nodes] of Object.entries(nodesByKey)) {
		let customValidity = error[key];

		for (const node of nodes) {
			if (!isFieldElement(node)) {
				continue;
			}

			node.setCustomValidity(customValidity);
		}
	}
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
): { [Key in keyof Type]: FieldConfig<Type[Key]> } {
	const result: { [Key in keyof Type]: FieldConfig<Type[Key]> } = {} as any;

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
