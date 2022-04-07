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

export interface Constraint {
	attribute: keyof FieldAttributes;
	message: string | undefined;
	value: unknown;
}

export type Field = ReturnType<typeof createField>;

function createField<FieldType extends keyof FieldOption>(type: FieldType): FieldOption[FieldType] {
	const supportedAttributes = attributesByType[type];
	const constraints: Constraint[] = [];
	
	const addConstraint = (attribute: keyof FieldAttributes, message: string | undefined, value?: unknown): void => {
		if (!supportedAttributes.includes(attribute)) {
			console.warn(`Unsupported attribute ${attribute} will be ignored on "${type}"`);
			return;
		}
		
		constraints.push({ attribute, value, message });
	};
	
	const field = {
		required(message?: string) {
			addConstraint('required', message);
			return field;
		},
		min(value: number | Date | string, message?: string) {
			addConstraint('min', message, value);
			return field;
		},
		max(value: number | Date | string, message?: string) {
			addConstraint('max', message, value);
			return field;
		},
		minLength(number: number, message?: string) {
			addConstraint('minLength', message, number);
			return field;
		},
		maxLength(number: number, message?: string) {
			addConstraint('maxLength', message, number);
			return field;
		},
		pattern(regexp: RegExp, message?: string) {
			if (regexp.global || regexp.ignoreCase || regexp.multiline) {
				console.warn(`global, ignoreCase, and multiline flags are not supported on the pattern attribute`);
			} else {
				addConstraint('pattern', message, regexp.source);
			}
			
			return field;
		},
		getType() {
			return !['textarea', 'select'].includes(type) ? type : undefined;
		},
		getConstraints() {
			return constraints;
		},
	};
	
	// @ts-ignore
	return Object.fromEntries(['getType', 'getConstraints'].concat(supportedAttributes).map(attribute => [attribute, field[attribute]]));
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
	email: () => createField('email'),
	file: () => createField('file'),
	hidden: () => createField('hidden'),
	// image: () => createField('image'),
	month: () => createField('month'),
	number: () => createField('number'),
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
	url: () => createField('url'),
	week: () => createField('week'),
};

export function getFieldAttributes(constraints: Constraint[]): FieldAttributes {
	let props: FieldAttributes = {
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
			case 'required':
			props.required = true;
			break;
			case 'min':
			case 'max':
			if (constraint.value instanceof Date) {
				props[constraint.attribute] = constraint.value.toISOString();
			} else {
				props[constraint.attribute] = constraint.value as any;
			}
			break;
			case 'step':
			case 'minLength':
			case 'maxLength':
			case 'pattern':
			props[constraint.attribute] = constraint.value as any;
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
		} else if (validity.badInput || validity.typeMismatch) {
			return null;
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