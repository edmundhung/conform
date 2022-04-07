interface Required {
	required: (message?: string) => this;
}

interface Min<Value> {
	min(value: Value | string, message?: string): this;
}

interface Max<Value> {
	max(value: Value | string, message?: string): this;
}

interface MinLength {
	minLength(number: number, message?: string): this;
}

interface MaxLength {
	maxLength(number: number, message?: string): this;
}

interface Pattern {
	pattern(regexp: RegExp, message?: string): this;
}

interface Step {
	step(number: number | string, message?: string): this;
}

interface NoConstraint {
	getConstraints(): Constraint[]
}

export interface FieldAttributes {
	type?: Exclude<keyof FieldOption, 'select' | 'textarea'>;
	required?: boolean,
	minLength?: number,
	maxLength?: number,
	min?: string | number,
	max?: string | number,
	step?: string | number,
	pattern?: string,
}

export interface FieldOption {
	// 'button': NoConstraint;
	'checkbox': Required;
	'color': NoConstraint;
	'date': Required & Min<Date> & Max<Date> & Step;
	'datetime': Required & Min<Date> & Max<Date> & Step;
	'datetime-local': Required & Min<Date> & Max<Date> & Step;
	'email': Required & MinLength & MaxLength & Pattern;
	'file': Required;
	'hidden': NoConstraint;
	// 'image': NoConstraint;
	'month': Required & Min<Date> & Max<Date> & Step;
	'number': Required & Min<number> & Max<number> & Step;
	'password': Required & MinLength & MaxLength & Pattern;
	'radio': Required;
	'range': Min<number> & Max<number> & Step;
	// 'reset': NoConstraint;
	'search': Required & MinLength & MaxLength & Pattern;
	'select': Required;
	// 'submit': NoConstraint;
	'tel': Required & MinLength & MaxLength & Pattern;
	'text': Required & MinLength & MaxLength & Pattern;
	'textarea': Required & MinLength & MaxLength;
	'time': Required & Min<Date> & Max<Date> & Step;
	'url': Required & MinLength & MaxLength & Pattern;
	'week': Required & Min<Date> & Max<Date> & Step;
};

const attributesByType: Record<keyof FieldOption, Array<keyof FieldAttributes>> = {
	// 'button': [],
	'checkbox': ['required'],
	'color': [],
	'date': ['required', 'minLength', 'maxLength', 'pattern'],
	'datetime': ['required', 'minLength', 'maxLength', 'pattern'],
	'datetime-local': ['required', 'minLength', 'maxLength', 'pattern'],
	'email': ['required', 'minLength', 'maxLength', 'pattern'],
	'file': ['required'],
	'hidden': [],
	// 'image': [],
	'month': ['required', 'minLength', 'maxLength', 'pattern'],
	'number': ['required', 'minLength', 'maxLength', 'pattern'],
	'password': ['required', 'minLength', 'maxLength', 'pattern'],
	'radio': ['required'],
	'range': ['min', 'max', 'step'],
	// 'reset': [],
	'search': ['required', 'minLength', 'maxLength', 'pattern'],
	'select': ['required'],
	// 'submit': [],
	'tel': ['required', 'minLength', 'maxLength', 'pattern'],
	'text': ['required', 'minLength', 'maxLength', 'pattern'],
	'textarea': ['required', 'minLength', 'maxLength'],
	'time': ['required', 'minLength', 'maxLength', 'pattern'],
	'url': ['required', 'minLength', 'maxLength', 'pattern'],
	'week': ['required', 'minLength', 'maxLength', 'pattern'],
};

export type Constraint = {
	attribute: 'type';
	value: keyof FieldOption;
	message: string | undefined;
} | {
	attribute: 'required';
	message: string | undefined;
} | {
	attribute: 'minLength';
	value: number;
	message: string | undefined;
} | {
	attribute: 'maxLength';
	value: number;
	message: string | undefined;
} | {
	attribute: 'min';
	value: Date | number | string;
	message: string | undefined;
} | {
	attribute: 'max';
	value: Date | number | string;
	message: string | undefined;
} | {
	attribute: 'step';
	value: number | string;
	message: string | undefined;
} | {
	attribute: 'pattern';
	value: RegExp;
	message: string | undefined;
};

export type Field = ReturnType<typeof createField>;

function createField<FieldType extends keyof FieldOption>(type: FieldType, message?: string): FieldOption[FieldType] {
	const supportedAttributes = attributesByType[type];
	const constraints: Constraint[] = [
		{ attribute: 'type', value: type, message: message },
	];
	
	const field = {
		required(message?: string) {
			constraints.push({ attribute: 'required', message });
			return field;
		},
		min(value: number | Date | string, message?: string) {
			constraints.push({ attribute: 'min', value, message });
			return field;
		},
		max(value: number | Date | string, message?: string) {
			constraints.push({ attribute: 'max', value, message });
			return field;
		},
		minLength(value: number, message?: string) {
			constraints.push({ attribute: 'minLength', value, message });
			return field;
		},
		maxLength(value: number, message?: string) {
			constraints.push({ attribute: 'maxLength', value, message });
			return field;
		},
		pattern(value: RegExp, message?: string) {
			if (value.global || value.ignoreCase || value.multiline) {
				console.warn(`global, ignoreCase, and multiline flags are not supported on the pattern attribute`);
			} else {
				constraints.push({ attribute: 'pattern', value, message });
			}
			
			return field;
		},
		getConstraints() {
			const orders: Array<keyof FieldAttributes> = [
				'required',
				'minLength',
				'maxLength',
				'min',
				'max',
				'type',
				'step',
				'pattern'
			];

			return [...constraints]
				.sort((prev, next) => orders.indexOf(prev.attribute) - orders.indexOf(next.attribute));
		},
	};
	
	// @ts-ignore
	return Object.fromEntries(['getConstraints'].concat(supportedAttributes).map(attribute => [attribute, field[attribute]]));
}

/**
* Helpers for constructing the field constraints
* @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation#validation-related_attributes
*/
export const f = {
	// button: () => createField('button'),
	checkbox: () => createField('checkbox'),
	color: () => createField('color'),
	date: () => createField('date'),
	// datetime: () => createField('datetime'),
	datetime: () => createField('datetime-local'), // `datetime` is deprecated
	email: (message?: string) => createField('email', message),
	file: () => createField('file'),
	hidden: () => createField('hidden'),
	// image: () => createField('image'),
	month: () => createField('month'),
	number: (message?: string) => createField('number', message),
	password: () => createField('password'),
	radio: () => createField('radio'),
	range: () => createField('range'),
	// reset: () => createField('reset'),
	search: () => createField('search'),
	select: () => createField('select'),
	// submit: () => createField('submit'),
	tel: () => createField('tel'),
	text: () => createField('text'),
	textarea: () => createField('textarea'),
	time: () => createField('time'),
	url: (message?: string) => createField('url', message),
	week: () => createField('week'),
};

export function getFieldAttributes(constraints: Constraint[]): FieldAttributes {
	let props: FieldAttributes = {
		type: undefined,
		required: false,
		minLength: undefined,
		maxLength: undefined,
		min: undefined,
		max: undefined,
		step: undefined,
		pattern: undefined,
	};
	
	for (let constraint of constraints) {
		switch (constraint.attribute) {
			case 'type':
				props.type = constraint.value !== 'textarea' && constraint.value !== 'select'
					? constraint.value
					: undefined;
				break;
			case 'required':
				props.required = true;
				break;
			case 'min':
			case 'max':
				props[constraint.attribute] = constraint.value instanceof Date
					? constraint.value.toISOString()
					: constraint.value;
				break;
			case 'minLength':
			case 'maxLength':
				props[constraint.attribute] = constraint.value;
				break;
			case 'step':
				props[constraint.attribute] = constraint.value;
				break;
			case 'pattern':
				props[constraint.attribute] = constraint.value.source;
				break;
		}
	}
	
	return props;
};

export function configureCustomValidity(constraints: Constraint[]): ((validity: ValidityState) => string | null) | undefined {
	function checkCustomValidity(validity: ValidityState): string | null {
		if (validity.valueMissing) {
			return constraints.find(constraint => constraint.attribute === 'required')?.message ?? null;
		} else if (validity.tooShort) {
			return constraints.find(constraint => constraint.attribute === 'minLength')?.message ?? null;
		} else if (validity.tooLong) {
			return constraints.find(constraint => constraint.attribute === 'maxLength')?.message ?? null;
		} else if (validity.stepMismatch) {
			return constraints.find(constraint => constraint.attribute === 'step')?.message ?? null;
		} else if (validity.rangeUnderflow) {
			return constraints.find(constraint => constraint.attribute === 'min')?.message ?? null;
		} else if (validity.rangeOverflow) {
			return constraints.find(constraint => constraint.attribute === 'max')?.message ?? null;
		} else if (validity.patternMismatch) {
			return constraints.find(constraint => constraint.attribute === 'max')?.message ?? null;
		} else if (validity.typeMismatch || validity.badInput) {
			return constraints.find(constraint => constraint.attribute === 'type')?.message ?? null;
		} else {
			return '';
		}
	}
	
	return checkCustomValidity;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isElement<T extends HTMLElement>(element: any, tag: string): element is T {
	return !!element && element.tagName.toLowerCase() === tag;
}

export function isInputElement(element: unknown): element is HTMLInputElement {
	return isElement<HTMLInputElement>(element, 'input');
}

export function isSelectElement(element: unknown): element is HTMLSelectElement {
	return isElement<HTMLSelectElement>(element, 'select');
}

export function isTextareaElement(element: unknown): element is HTMLTextAreaElement {
	return isElement<HTMLTextAreaElement>(element, 'textarea');
}

export function isDirtyField(element: HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement): boolean {
	if (isElement<HTMLInputElement>(element, 'input') || isElement<HTMLTextAreaElement>(element, 'textarea')) {
		return element.value !== element.defaultValue;
	} else if (isElement<HTMLSelectElement>(element, 'select')) {
		return element.value !== Array.from(element.options).find(option => option.defaultSelected)?.value;
	} else {
		return false;
	}
}

export function isValidationConstraintSupported(element: unknown): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
	if (!isInputElement(element) && !isSelectElement(element) && !isTextareaElement(element)) {
		return false;
	}

	return typeof element.checkValidity === 'function';
}