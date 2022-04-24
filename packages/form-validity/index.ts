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

export type FieldType =
	| InputType
	| 'select'
	| 'textarea'
	| 'fieldset'
	| 'fieldset-array';

export interface FieldConfig<Type extends FieldType = FieldType> {
	type: Type;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: string;
	max?: string;
	step?: string;
	multiple?: boolean;
	pattern?: string;
	options?: string[];
	count?: number;
	validity?: {
		valueMissing?: string;
		badInput?: string;
		tooShort?: string;
		tooLong?: string;
		rangeUnderflow?: string;
		rangeOverflow?: string;
		stepMismatch?: string;
		typeMismatch?: string;
		patternMismatch?: string;
	};
	constraints?: Array<{
		isValid: (value: any) => boolean;
		message: string;
	}>;
}

export function isElement<T extends HTMLElement>(
	element: any,
	tag: string,
): element is T {
	return !!element && element.tagName.toLowerCase() === tag;
}

export function isFieldElement(
	element: unknown,
): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
	return (
		isElement<HTMLInputElement>(element, 'input') ||
		isElement<HTMLSelectElement>(element, 'select') ||
		isElement<HTMLTextAreaElement>(element, 'textarea')
	);
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

export function process(payload: FormData | URLSearchParams | string): {
	data: Record<string, any>;
	isDraft: boolean;
} {
	const entries: URLSearchParams | FormData =
		payload instanceof URLSearchParams || payload instanceof FormData
			? payload
			: new URLSearchParams(payload);
	const data = unflatten(entries);
	const update = getDraft(entries);

	if (update) {
		const list = getDataByName(data, update.name);

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

	return {
		data,
		isDraft: update !== null,
	};
}

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

export function getDataByName<T = any>(
	obj: any,
	name: string,
	defaultValue?: T,
): T | undefined {
	let target = obj;

	for (let path of getPaths(name)) {
		if (typeof target[path] === 'undefined') {
			return defaultValue;
		}

		target = target[path];
	}

	return target;
}

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

export function checkCustomValidity(
	validity: ValidityState,
	config: FieldConfig,
): string | null {
	const validityKeys: Array<keyof Required<FieldConfig>['validity']> = [
		'valueMissing',
		'tooShort',
		'tooLong',
		'stepMismatch',
		'rangeUnderflow',
		'rangeOverflow',
		'typeMismatch',
		'badInput',
		'patternMismatch',
	];

	for (let key of validityKeys) {
		if (validity[key]) {
			return config.validity?.[key] ?? null;
		}
	}

	if (validity.customError) {
		return null;
	}

	return '';
}

/**
 * Mnaully trigger an invalid event
 * @param field
 */
export function revalidate(field: EventTarget): void {
	field.dispatchEvent(new Event('invalid'));
}

/**
 * Check if the form or field is valid
 * by manually triggering an invalid event and check the final validity
 * @param field
 * @returns
 */
export function checkValidity(field: unknown): boolean {
	if (isFieldElement(field)) {
		// We can skip this if there is no custom validation configured
		revalidate(field);

		// Check the latest validity
		return field.validity.valid;
	} else if (isElement<HTMLFormElement>(field, 'form')) {
		let isValid = true;

		for (let element of Array.from(field.elements)) {
			if (!checkValidity(element)) {
				isValid = false;
			}
		}

		return isValid;
	}

	// Assuming it to be valid and fallback to server validation
	return true;
}

/**
 * Refine the config setting based on type
 * @param config
 */
export function patchNativeConstraints<Type extends FieldType>(
	config: FieldConfig<Type>,
	validityKeys: Array<keyof Omit<ValidityState, 'customError' | 'valid'>>,
): FieldConfig<Type> {
	const constraints: FieldConfig['constraints'] = [];
	const result: FieldConfig<Type> = {
		...config,
		validity: {
			...config.validity,
		},
		constraints: [...(config.constraints ?? [])],
	};

	for (let key of validityKeys) {
		switch (key) {
			case 'valueMissing':
				if (config.required) {
					constraints.push({
						isValid: (value: string) => value === '',
						message: config.validity?.valueMissing ?? 'This field is required',
					});

					delete result.required;
					delete result.validity?.valueMissing;
				}
				break;
			case 'tooShort':
				if (typeof config.minLength !== 'undefined') {
					constraints.push({
						isValid: (
							(minLength: number) => (value: string) =>
								value.length > minLength
						)(config.minLength),
						message:
							config.validity?.tooShort ??
							`This field should have minimum ${config.minLength} characters`,
					});

					delete result.minLength;
					delete result.validity?.tooShort;
				}
				break;
			case 'tooLong':
				if (typeof config.maxLength !== 'undefined') {
					constraints.push({
						isValid: (
							(maxLength: number) => (value: string) =>
								value.length < maxLength
						)(config.maxLength),
						message:
							config.validity?.tooLong ??
							`This field should have maximum ${config.maxLength} characters`,
					});

					delete result.maxLength;
					delete result.validity?.tooLong;
				}
				break;
			case 'rangeUnderflow':
				if (typeof config.min !== 'undefined') {
					const isDateType =
						config.type === 'date' ||
						config.type === 'datetime-local' ||
						config.type === 'month' ||
						config.type === 'time' ||
						config.type === 'week';

					constraints.push({
						isValid: isDateType
							? (
									(min: string) => (value: string) =>
										new Date(value) > new Date(min)
							  )(config.min)
							: (
									(min: string) => (value: string) =>
										Number(value) > Number(min)
							  )(config.min),
						message:
							config.validity?.rangeUnderflow ??
							`This field should be min ${
								isDateType ? new Date(config.min) : config.min
							}`,
					});

					delete config.min;
					delete config.validity?.rangeUnderflow;
				}
				break;
			case 'rangeOverflow':
				if (typeof config.max !== 'undefined') {
					const isDateType =
						config.type === 'date' ||
						config.type === 'datetime-local' ||
						config.type === 'month' ||
						config.type === 'time' ||
						config.type === 'week';

					constraints.push({
						isValid: isDateType
							? (
									(max: string) => (value: string) =>
										new Date(value) < new Date(max)
							  )(config.max)
							: (
									(max: string) => (value: string) =>
										Number(value) < Number(max)
							  )(config.max),
						message:
							config.validity?.rangeOverflow ??
							`This field should be max ${
								isDateType ? new Date(config.max) : config.max
							}`,
					});

					delete config.max;
					delete config.validity?.rangeOverflow;
				}
				break;
			case 'patternMismatch':
				if (config.pattern) {
					constraints.push({
						isValid: (
							(pattern: string) => (value: string) =>
								new RegExp(pattern).test(value)
						)(config.pattern),
						message:
							config.validity?.patternMismatch ?? 'This field is invalid',
					});

					delete config.pattern;
					delete config.validity?.patternMismatch;
				}
				break;
			case 'badInput':
			case 'stepMismatch':
				// TODO
				break;
			case 'typeMismatch':
				if (config.type === 'file' || config.type === 'url') {
					constraints.push({
						isValid:
							config.type === 'file'
								? (value: any) => value instanceof File
								: config.type === 'url'
								? (value: string) => {
										try {
											new URL(value);
											return true;
										} catch {
											return false;
										}
								  }
								: () => false,
						message: config.validity?.typeMismatch ?? 'This field is invalid',
					});

					delete config.validity?.typeMismatch;
				}
		}
	}

	return {
		...result,
		constraints: constraints.concat(result.constraints ?? []),
	};
}

export function refineConfig<Type extends FieldType>(
	config: FieldConfig<Type>,
): FieldConfig<Type> {
	switch (config.type) {
		case 'checkbox':
		case 'radio':
		case 'file':
		case 'select':
			return patchNativeConstraints(config, [
				'tooShort',
				'tooLong',
				'rangeUnderflow',
				'rangeOverflow',
				'stepMismatch',
				'patternMismatch',
			]);
		case 'date':
		case 'datetime-local':
		case 'month':
		case 'time':
		case 'week':
		case 'number':
			return patchNativeConstraints(config, [
				'tooShort',
				'tooLong',
				'patternMismatch',
			]);
		case 'email':
		case 'password':
		case 'search':
		case 'tel':
		case 'text':
		case 'url':
			return patchNativeConstraints(config, [
				'rangeUnderflow',
				'rangeOverflow',
				'stepMismatch',
			]);
		case 'range':
			return patchNativeConstraints(config, [
				'valueMissing',
				'tooShort',
				'tooLong',
				'patternMismatch',
			]);
		case 'textarea':
			return patchNativeConstraints(config, [
				'rangeUnderflow',
				'rangeOverflow',
				'patternMismatch',
			]);
		default:
			return config;
	}
}
