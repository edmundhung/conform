type Required<T> = undefined extends T
	? { required?: false }
	: { required: true };

export type Schema<
	Shape extends Record<
		string,
		string | number | boolean | Date | File | File[]
	>,
> = {
	[Key in keyof Shape]: File[] extends Shape[Key]
		? Required<Shape[Key]> & {
				type: 'file';
				multiple: true;
		  }
		: File extends Shape[Key]
		? Required<Shape[Key]> & {
				type: 'file';
				multiple?: false;
		  }
		: Date extends Shape[Key]
		? Required<Shape[Key]> & {
				type: 'datetime-local';
				min?: string;
				max?: string;
				step?: number;
		  }
		: number extends Shape[Key]
		? Required<Shape[Key]> & {
				type: 'number' | 'range';
				required?: boolean;
				min?: number;
				max?: number;
				step?: number;
		  }
		: boolean extends Shape[Key]
		? {
				type: 'checkbox';
				required?: boolean;
				value?: string;
		  }
		: string extends Shape[Key]
		? Required<Shape[Key]> &
				(
					| {
							type: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';
							minLength?: number;
							maxLength?: number;
							pattern?: string;
					  }
					| {
							type: 'date' | 'month' | 'week' | 'time';
							min?: string;
							max?: string;
							step?: string;
					  }
					| {
							type: 'radio' | 'color';
					  }
				)
		: never;
};

export type SchemaValidity<Shape extends Record<string, string[]>> =
	| {
			payload: Record<string, string | undefined>;
			error: Record<string, string[]>;
	  }
	| {
			payload: Record<string, string | undefined>;
			error: null;
			value: Shape;
	  };

export function ensureSingleTextValue(
	data: FormData | URLSearchParams,
	name: string,
): string {
	if (!data.has(name)) {
		throw new Error(`${name} is missing`);
	}

	const [text, ...rest] = data.getAll(name);

	if (rest.length > 1) {
		throw new Error(`${name} is not configured for multiple values`);
	}

	if (typeof text !== 'string') {
		throw new Error(`${name} is not a string`);
	}

	return text;
}

/**
 * Check if the file is empty
 */
export function isEmptyFile(file: File): boolean {
	return file.name === '' && file.size === 0;
}

/**
 * Check URL validity as if url input type
 */
export function isValidURL(url: string): boolean {
	try {
		new URL(url);
	} catch (e) {
		return false;
	}

	return true;
}

/**
 * Check email validity as if email input type
 * @see https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
 */
export function isValidEmail(email: string): boolean {
	return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
		email,
	);
}

/**
 * Check if the text matches the pattern as if pattern input attribute
 */
export function matchPattern(pattern: string, text: string): boolean {
	if (pattern === '') {
		return text === '';
	}

	// TODO: ensure pattern will match the whole text
	return new RegExp(pattern).test(text);
}

export function validate<Shape extends Record<string, any>>(
	data: FormData | URLSearchParams,
	schema: Schema<Shape>,
): SchemaValidity<Shape> {
	const payload = new Map<keyof Shape, string | undefined>();
	const error = new Map<keyof Shape, string[]>();
	const value = new Map<keyof Shape, any>();

	for (const name in schema) {
		const constraint = schema[name];
		const messages = new Set<string>();

		switch (constraint.type) {
			case 'text':
			case 'email':
			case 'password':
			case 'url':
			case 'tel':
			case 'search': {
				const text = ensureSingleTextValue(data, name);

				if (constraint.required && text === '') {
					messages.add('required');
				}

				if (text !== '') {
					switch (constraint.type) {
						case 'email':
							if (!isValidEmail(text)) {
								messages.add('type');
							}
							break;
						case 'url':
							if (!isValidURL(text)) {
								messages.add('type');
							}
							break;
					}

					if (text !== '') {
						if (
							typeof constraint.minLength !== 'undefined' &&
							text.length < constraint.minLength
						) {
							messages.add('minlength');
						}

						if (
							typeof constraint.maxLength !== 'undefined' &&
							text.length > constraint.maxLength
						) {
							messages.add('maxlength');
						}

						if (
							typeof constraint.pattern !== 'undefined' &&
							!matchPattern(constraint.pattern, text)
						) {
							messages.add('pattern');
						}
					}

					payload.set(name, text);
					value.set(name, text);
				}
				break;
			}
			case 'number':
			case 'range': {
				const text = ensureSingleTextValue(data, name);

				if (constraint.required && text === '') {
					messages.add('required');
				}

				if (text !== '') {
					const number = Number(text);

					if (Number.isNaN(number)) {
						messages.add('type');
					} else {
						if (
							typeof constraint.min !== 'undefined' &&
							number < constraint.min
						) {
							messages.add('min');
						}

						if (
							typeof constraint.max !== 'undefined' &&
							number > constraint.max
						) {
							messages.add('max');
						}

						if (
							typeof constraint.step !== 'undefined' &&
							number % constraint.step !== 0
						) {
							messages.add('step');
						}

						value.set(name, number);
					}
				}

				payload.set(name, text);
				break;
			}
			case 'checkbox': {
				const [item, ...rest] = data.getAll(name);

				if (rest.length > 0) {
					throw new Error(`${name} is not configured for multiple values`);
				}

				if (item && item !== (constraint.value ?? 'on')) {
					throw new Error(
						`${name} is not configured with value ${constraint.value}`,
					);
				}

				const flag = typeof item !== 'undefined';

				if (constraint.required && !flag) {
					messages.add('required');
				}

				value.set(name, flag);
				payload.set(name, item);
				break;
			}
			case 'datetime-local': {
				const text = ensureSingleTextValue(data, name);

				// TODO: validate text format

				if (constraint.required && text === '') {
					messages.add('required');
				}

				if (text !== '') {
					const date = new Date(text);

					if (Number.isNaN(date.valueOf())) {
						messages.add('type');
					} else {
						if (
							typeof constraint.min !== 'undefined' &&
							date < new Date(constraint.min)
						) {
							messages.add('min');
						}

						if (
							typeof constraint.max !== 'undefined' &&
							date > new Date(constraint.max)
						) {
							messages.add('max');
						}

						if (
							typeof constraint.step !== 'undefined' &&
							date.valueOf() % (constraint.step * 1000) !== 0
						) {
							messages.add('step');
						}

						value.set(name, text);
					}
				}

				payload.set(name, text);
				break;
			}
			case 'date':
			case 'month':
			case 'week':
			case 'time': {
				const text = ensureSingleTextValue(data, name);

				if (constraint.required && text === '') {
					messages.add('required');
				}

				// TODO: handle each text format

				value.set(name, text);
				payload.set(name, text);
				break;
			}
			case 'radio':
			case 'color': {
				const text = ensureSingleTextValue(data, name);

				if (constraint.required && text === '') {
					messages.add('required');
				}

				// TODO: handle color format

				value.set(name, text);
				payload.set(name, text);
				break;
			}
			case 'file': {
				const files = data.getAll(name);

				if (!constraint.multiple && files.length > 1) {
					throw new Error(`${name} is not configured for multiple files`);
				}

				if (!files.every((file): file is File => file instanceof File)) {
					throw new Error(`${name} is not a file`);
				}

				const nonEmptyFiles = files.filter((file) => !isEmptyFile(file));

				if (constraint.required && nonEmptyFiles.length === 0) {
					messages.add('required');
				}

				if (constraint.multiple || nonEmptyFiles.length > 0) {
					value.set(
						name,
						constraint.multiple ? nonEmptyFiles : nonEmptyFiles[0],
					);
				}
				break;
			}
		}

		if (messages.size > 0) {
			error.set(name, [...messages]);
		}
	}

	if (error.size > 0) {
		return {
			payload: Object.fromEntries(payload),
			error: Object.fromEntries(error),
		};
	}

	return {
		payload: Object.fromEntries(payload),
		error: null,
		value: Object.fromEntries(value) as Shape,
	};
}

export function getMessages(
	validity: ValidityState,
	validationMessage?: string,
	delimiter?: string,
): string[] {
	const messages = [] as string[];

	if (validity.valueMissing) {
		messages.push('required');
	}

	if (validity.typeMismatch || validity.badInput) {
		messages.push('type');
	}

	if (validity.rangeOverflow) {
		messages.push('max');
	}

	if (validity.rangeUnderflow) {
		messages.push('min');
	}

	if (validity.stepMismatch) {
		messages.push('step');
	}

	if (validity.tooShort) {
		messages.push('minlength');
	}

	if (validity.tooLong) {
		messages.push('maxlength');
	}

	if (validity.patternMismatch) {
		messages.push('pattern');
	}

	if (validity.customError && validationMessage) {
		if (delimiter) {
			messages.push(...validationMessage.split(delimiter));
		} else {
			messages.push(validationMessage);
		}
	}

	return messages;
}
