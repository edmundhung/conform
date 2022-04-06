
export interface FieldAttributes {
	required?: boolean,
	minLength?: number,
	maxLength?: number,
	min?: string | number,
	max?: string | number,
	step?: string,
	pattern?: string,
}

export type FieldType = 'button'
	| 'checkbox'
	| 'color'
	| 'date'
	| 'datetime'
	| 'datetime-local'
	| 'email'
	| 'file'
	| 'hidden'
	| 'image'
	| 'month'
	| 'number'
	| 'password'
	| 'radio'
	| 'range'
	| 'reset'
	| 'search'
	| 'select'
	| 'submit'
	| 'tel'
	| 'text'
	| 'textarea'
	| 'time'
	| 'url'
	| 'week';

/**
 * Supported attributes by input type or element (textarea / select)
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation#validation-related_attributes
 */
const supportedAttributesByControlType: Record<FieldType, Array<keyof FieldAttributes>> = {
  // input elements
  button: [],
  checkbox: ['required'],
  color: [],
  date: ['min', 'max', 'required', 'step'],
  datetime: ['min', 'max', 'required', 'step'],
  'datetime-local': ['min', 'max', 'required', 'step'],
  email: ['pattern', 'required', 'minLength', 'maxLength'],
  file: ['required'],
  hidden: [],
  image: [],
  month: ['min', 'max', 'required', 'step'],
  number: ['min', 'max', 'required', 'step'],
  password: ['pattern', 'required', 'minLength', 'maxLength'],
  radio: ['required'],
  range: ['min', 'max', 'step'],
  reset: [],
  search: ['pattern', 'required', 'minLength', 'maxLength'],
  submit: [],
  tel: ['pattern', 'required', 'minLength', 'maxLength'],
  text: ['pattern', 'required', 'minLength', 'maxLength'],
  time: ['min', 'max', 'required', 'step'],
  url: ['pattern', 'required', 'minLength', 'maxLength'],
  week: ['min', 'max', 'required', 'step'],

  // non-input elements
  textarea: ['required', 'minLength', 'maxLength'],
  select: ['required'],
};

export interface Constraint {
	attribute: keyof FieldAttributes;
	message: string | undefined;
	value: unknown;
}

export type Field = ReturnType<typeof createField>;

function createField(type: FieldType) {
	const supportedAttributes = supportedAttributesByControlType[type];
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
    min(min: number | Date | string, message?: string) {
			addConstraint('min', message, min);
      return field;
    },
    max(max: number | Date | string, message?: string) {
			addConstraint('max', message, max);
      return field;
    },
    minLength(minLength: number, message?: string) {
			addConstraint('minLength', message, minLength);
      return field;
    },
		maxLength(maxLength: number, message?: string) {
			addConstraint('maxLength', message, maxLength);
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
	getConstraints() {
		return constraints;
	},
  };

  return field;
}

export const f = {
	text() {
		return createField('text');
	},
	email() {
		return createField('email');
	},
	password() {
		return createField('password');
	},
	checkbox() {
		return createField('checkbox');
	},

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