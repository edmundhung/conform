/**
 *
 */
const symbol = Symbol('constraint');

export type FieldTag = 'input' | 'textarea' | 'select' | 'fieldset';

export type InputType =
	| 'checkbox'
	| 'color'
	| 'date'
	| 'date'
	| 'datetime-local'
	| 'email'
	| 'fieldset'
	| 'file'
	| 'hidden'
	| 'month'
	| 'number'
	| 'password'
	| 'radio'
	| 'range'
	| 'search'
	| 'select'
	| 'tel'
	| 'text'
	| 'textarea'
	| 'time'
	| 'url'
	| 'week';

export type Field<
	Tag extends FieldTag = FieldTag,
	Type extends InputType | undefined = undefined,
> = (Tag extends 'input'
	? Type extends 'checkbox' | 'file' | 'radio'
		? Required
		: Type extends 'date' | 'datetime-local' | 'month' | 'time' | 'week'
		? Required & Min<Date> & Max<Date> & Step
		: Type extends 'email' | 'password' | 'search' | 'tel' | 'text' | 'url'
		? Required & MinLength & MaxLength & Pattern
		: Type extends 'number'
		? Required & Min<number> & Max<number> & Step
		: Type extends 'range'
		? Min<number> & Max<number> & Step
		: {}
	: Tag extends 'select'
	? Required
	: Tag extends 'textarea'
	? Required & MinLength & MaxLength
	: Tag extends 'fieldset'
	? Multiple<number>
	: unknown) & { [symbol]: Constraint<Tag> };

export type Constraint<Tag extends FieldTag = FieldTag> = {
	tag: Tag;
	type?: {
		value: InputType;
		message: string | undefined;
	};
	required?: {
		message: string | undefined;
	};
	minLength?: {
		value: number;
		message: string | undefined;
	};
	maxLength?: {
		value: number;
		message: string | undefined;
	};
	min?: {
		value: Date | number;
		message: string | undefined;
	};
	max?: {
		value: Date | number;
		message: string | undefined;
	};
	step?: {
		value: number | string;
		message: string | undefined;
	};
	pattern?: Array<{
		value: RegExp;
		message: string | undefined;
	}>;
	multiple?: {
		value: number | undefined;
		message: string | undefined;
	};
};

function configureF() {
	function createField<Tag extends FieldTag>(
		tag: Tag,
		type?: InputType,
		message?: string,
	) {
		const constraint: Constraint<Tag> = {
			tag,
		};

		if (type) {
			constraint.type = { value: type, message };
		}

		return {
			required(message?: string) {
				constraint.required = { message };
				return this;
			},
			min(value: number | Date, message?: string) {
				constraint.min = { value, message };
				return this;
			},
			max(value: number | Date, message?: string) {
				constraint.max = { value, message };
				return this;
			},
			minLength(value: number, message?: string) {
				constraint.minLength = { value, message };
				return this;
			},
			maxLength(value: number, message?: string) {
				constraint.maxLength = { value, message };
				return this;
			},
			pattern(value: RegExp, message?: string) {
				if (value.global || value.ignoreCase || value.multiline) {
					console.warn(
						`global, ignoreCase, and multiline flags are not supported on the pattern attribute`,
					);
				} else {
					constraint.pattern = (constraint.pattern ?? []).concat({
						value,
						message,
					});
				}

				return this;
			},
			multiple(value?: number) {
				constraint.multiple = { value, message };
				return this;
			},
			[symbol]: constraint,
		};
	}

	function input<T extends 'email' | 'number' | 'url'>(
		type: T,
		message?: string,
	): Field<'input', T>;
	function input<T extends Exclude<InputType, 'email' | 'number' | 'url'>>(
		type: T,
	): Field<'input', T>;
	function input<T extends InputType>(
		type: T,
		message?: string,
	): Field<'input', T> {
		// @ts-expect-error
		return createField('input', type, message);
	}

	function select(): Field<'select'> {
		return createField('select');
	}

	function textarea(): Field<'textarea'> {
		return createField('textarea');
	}

	function fieldset(): Field<'fieldset'> {
		return createField('fieldset');
	}

	return {
		input,
		select,
		textarea,
		fieldset,
	};
}

/**
 * Helpers for constructing the field constraint based on the type
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation#validation-related_attributes
 */
export const f = configureF();

export function getConstraint<Tag extends FieldTag>(
	field: Field<Tag>,
): Constraint<Tag> {
	if (typeof field[symbol] === 'undefined') {
		throw new Error(
			'Provided config is not a field; Please ensure only field object is used',
		);
	}

	return field[symbol];
}

export function isElement<T extends HTMLElement>(
	element: any,
	tag: string,
): element is T {
	return !!element && element.tagName.toLowerCase() === tag;
}

export function isDirty(element: unknown): boolean {
	if (isElement<HTMLFormElement>(element, 'form')) {
		for (let el of element.elements) {
			if (isDirty(el)) {
				return true;
			}
		}

		return false;
	}

	if (
		isElement<HTMLInputElement>(element, 'input') ||
		isElement<HTMLTextAreaElement>(element, 'textarea')
	) {
		return element.value !== element.defaultValue;
	}

	if (isElement<HTMLSelectElement>(element, 'select')) {
		return (
			element.value !==
			Array.from(element.options).find((option) => option.defaultSelected)
				?.value
		);
	}

	return false;
}

export function isValidationConstraintSupported(
	element: unknown,
): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
	if (
		!isElement<HTMLInputElement>(element, 'input') &&
		!isElement<HTMLSelectElement>(element, 'select') &&
		!isElement<HTMLTextAreaElement>(element, 'textarea')
	) {
		return false;
	}

	return typeof element.checkValidity === 'function';
}

export function shouldSkipValidate(element: unknown) {
	return isElement<HTMLButtonElement>(element, 'button') ||
		isElement<HTMLInputElement>(element, 'input')
		? element.formNoValidate
		: false;
}

export function draftUpdate(name: string, index?: number) {
	return {
		name: '__form-validity__',
		value: [name]
			.concat(typeof index === 'undefined' ? [] : [`${index}`])
			.join('|'),
	};
}

export function getDraft(payload: URLSearchParams | FormData) {
	const update = payload.get('__form-validity__');

	if (!update) {
		return null;
	}

	// We are mutating the payload here
	payload.delete('__form-validity__');

	if (update instanceof File) {
		throw new Error('What?');
	}

	const [name, indexString] = update.split('|');
	const index = typeof indexString !== 'undefined' ? Number(indexString) : null;

	return {
		name,
		index,
	};
}

export function parse<T>(
	payload: FormData | URLSearchParams | string,
	fieldsetCreator:
		| ((value?: Record<string, any>) => Record<string, T>)
		| Record<string, T>,
): {
	value: Record<string, any>;
	error: Record<string, string> | null;
	isDraft: boolean;
} {
	const valueEntries: URLSearchParams | FormData =
		payload instanceof URLSearchParams || payload instanceof FormData
			? payload
			: new URLSearchParams(payload);

	const update = getDraft(valueEntries);
	const value = unflatten(valueEntries);

	if (update) {
		const list = getItem(value, update.name);

		if (
			!Array.isArray(list) ||
			(update.index !== null && isNaN(update.index))
		) {
			throw new Error('Oops');
		}

		if (update.index !== null) {
			list.splice(update.index, 1);
		} else {
			list.push({});
		}
	}

	const fieldset =
		typeof fieldsetCreator === 'function'
			? fieldsetCreator(value)
			: fieldsetCreator;
	const valueByName = Object.fromEntries(valueEntries);
	const errorEntries: Array<[string, string]> = [];

	if (!update) {
		for (const [name, field] of flatten<Field>(
			fieldset,
			(f) => typeof f[symbol] !== 'undefined',
		)) {
			const constraint = getConstraint(field);
			const value = valueByName[name];
			const message = validate(value, constraint);

			if (message) {
				errorEntries.push([name, message]);
			}
		}
	}

	return {
		value,
		error: errorEntries.length > 0 ? unflatten(errorEntries) : null,
		isDraft: update !== null,
	};
}

/**
 * Helpers
 */

interface Required {
	required(message?: string): this;
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

interface Multiple<Count = void> {
	multiple(count: Count): this;
}

const pattern = /(\w+)\[(\d+)\]/;

function getPaths(key: string): Array<string | number> {
	return key.split('.').flatMap((key) => {
		const matches = pattern.exec(key);

		if (!matches) {
			return key;
		}

		return [matches[1], Number(matches[2])];
	});
}

function getItem(obj: any, key: string, defaultValue?: any): any {
	let target = obj;

	for (let path of getPaths(key)) {
		if (typeof target[path] === 'undefined') {
			return defaultValue;
		}

		target = target[path];
	}

	return target;
}

function flatten<T>(
	item: any,
	isLeaf: (item: any) => boolean,
	prefix = '',
): Array<[string, T]> {
	let entries: Array<[string, T]> = [];

	if (isLeaf(item)) {
		entries.push([prefix, item]);
	} else if (Array.isArray(item)) {
		for (var i = 0; i < item.length; i++) {
			entries.push(...flatten<T>(item[i], isLeaf, `${prefix}[${i}]`));
		}
	} else {
		for (const [key, value] of Object.entries(item)) {
			entries.push(
				...flatten<T>(value, isLeaf, prefix ? `${prefix}.${key}` : key),
			);
		}
	}

	return entries;
}

function unflatten<T>(
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

			pointer[key] = newValue;
			pointer = pointer[key];
		}
	}

	return result;
}

function validate(
	value: FormDataEntryValue | undefined,
	constraint: Constraint,
): string | null {
	if (value instanceof File) {
		return 'File is not supported yet';
	}

	if (constraint.required) {
		if (typeof value === 'undefined' || value === '') {
			return constraint.required.message ?? 'This field is required';
		}
	}

	if (constraint.minLength) {
		if (
			typeof value === 'undefined' ||
			value.length < constraint.minLength.value
		) {
			return (
				constraint.minLength.message ??
				`This field must be at least ${constraint.minLength.value} characters`
			);
		}
	}

	if (constraint.maxLength) {
		if (
			typeof value !== 'undefined' &&
			value.length > constraint.maxLength.value
		) {
			return (
				constraint.maxLength.message ??
				`This field must be at most ${constraint.maxLength.value} characters`
			);
		}
	}

	if (constraint.min) {
		if (
			constraint.min.value instanceof Date &&
			new Date(value ?? '') < constraint.min.value
		) {
			return (
				constraint.min.message ??
				`This field must be later than ${constraint.min.value.toISOString()}`
			);
		} else if (
			typeof constraint.min.value === 'number' &&
			Number(value ?? '') < constraint.min.value
		) {
			return (
				constraint.min.message ??
				`This field must be greater than or equal to ${constraint.min.value}`
			);
		}
	}

	if (constraint.max) {
		if (
			typeof value !== 'undefined' &&
			constraint.max.value instanceof Date &&
			new Date(value) > constraint.max.value
		) {
			return (
				constraint.max.message ??
				`This field must be at earlier than ${constraint.max.value.toISOString()}`
			);
		} else if (
			typeof value !== 'undefined' &&
			typeof constraint.max.value === 'number' &&
			Number(value) > constraint.max.value
		) {
			return (
				constraint.max.message ??
				`This field must be less than or equal to ${constraint.max.value}`
			);
		}
	}

	if (constraint.step) {
		// TODO
	}

	if (constraint.type) {
		switch (constraint.type.value) {
			case 'email':
				if (!/^\S+@\S+$/.test(value ?? '')) {
					return constraint.type.message ?? `This field must be a valid email`;
				}
				break;
			case 'url':
				const isURL = (value: string) => {
					try {
						new URL(value);
						return true;
					} catch {
						return false;
					}
				};
				if (!isURL(value ?? '')) {
					return constraint.type.message ?? `This field must be a valid URL`;
				}
				break;
		}
	}

	if (constraint.pattern?.length) {
		const pattern = constraint.pattern.find((pattern) => {
			const match = value?.match(pattern.value);

			return !match || value !== match[0];
		});

		if (pattern) {
			return pattern.message ?? `This field must be a valid format`;
		}
	}

	return null;
}
