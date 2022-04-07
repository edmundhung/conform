import { Form as RemixForm } from '@remix-run/react';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import type { UseFormValidationOptions, Constraint } from 'react-form-validity';
import { useFormValidation } from 'react-form-validity';

export { useFieldset, f } from 'react-form-validity';

export type FormProps = UseFormValidationOptions & ComponentProps<typeof RemixForm>;

export const Form = forwardRef<HTMLFormElement, FormProps>(
	({ reportValidity, noValidate, onBlur, onChange, onSubmit, ...props }, ref) => {
		const formProps = useFormValidation({
			reportValidity,
			noValidate,
			onBlur,
			onChange,
			onSubmit,
		});

		return <RemixForm ref={ref} {...props} {...formProps} />;
	},
);

Form.displayName = 'Form';

function flatten(item: any, isLeaf: (item: any) => boolean, prefix = ''): Array<[string, string]> {
	let entries: Array<[string, string]> = [];

    if (isLeaf(item)) {
		entries.push([prefix, item]);
    } else if (Array.isArray(item)) {
		for (var i = 0; i < item.length; i++) {
			entries.push(...flatten(item[i], isLeaf, `${prefix}[${i}]`));
		}
    } else {
		for (const [key, value] of Object.entries(item)) {
			entries.push(...flatten(value, isLeaf, prefix ? `${prefix}.${key}` : key));
		}
    }

	return entries;
}

function unflatten<T>(entries: Array<[string, T]> | Iterable<[string, T]>): any {
	const pattern = /(\w+)\[(\d+)\]/;
	const result: any = {};

	for (let [key, value] of entries) {
		let paths = key.split('.').flatMap(key => {
			const matches = pattern.exec(key);
	
			if (!matches) {
				return key;
			}
	
			return [matches[1], Number(matches[2])];
		});
		let length = paths.length;
		let lastIndex = length - 1;
		let index = -1;
		let pointer = result;

		while (pointer != null && ++index < length) {
			let key = paths[index];
			let next = paths[index + 1]
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

function validate(value: FormDataEntryValue | undefined, constraints: Constraint[]): string | null {
	if (value instanceof File) {
		return 'File is not supported yet';
	}

	for (let constraint of constraints) {
		switch (constraint.attribute) {
			case 'required':
				if (typeof value === 'undefined' || value === '') {
					return constraint.message ?? 'This field is required';
				}
				break;
			case 'minLength':
				if (typeof value === 'undefined' || value.length < constraint.value) {
					return constraint.message ?? `This field must be at least ${constraint.value} characters`;
				}
				break;
			case 'maxLength':
				if (typeof value !== 'undefined' && value.length > constraint.value) {
					return constraint.message ?? `This field must be at most ${constraint.value} characters`;
				}
				break;
			case 'min':
				if (constraint.value instanceof Date && new Date(value ?? '') < constraint.value) {
					return constraint.message ?? `This field must be later than ${constraint.value.toISOString()}`;
				} else if (typeof constraint.value === 'number' && Number(value ?? '') < constraint.value) {
					return constraint.message ?? `This field must be greater than or equal to ${constraint.value}`;
				}
				break;
			case 'max':
				if (typeof value !== 'undefined' && constraint.value instanceof Date && new Date(value) > constraint.value) {
					return constraint.message ?? `This field must be at earlier than ${constraint.value.toISOString()}`;
				} else if (typeof value !== 'undefined' && typeof constraint.value === 'number' && Number(value) > constraint.value) {
					return constraint.message ?? `This field must be less than or equal to ${constraint.value}`;
				}
				break;
			case 'step':
				// if (typeof value !== 'undefined' && constraint.value instanceof Date && new Date(value) > constraint.value) {
				// 	return constraint.message ?? `This field must be at earlier than ${constraint.value.toISOString()}`;
				// } else if (typeof value !== 'undefined' && typeof constraint.value === 'number' && Number(value) > constraint.value) {
				// 	return constraint.message ?? `This field must be less than or equal to ${constraint.value}`;
				// }
				break;
			case 'type':
				switch (constraint.value) {
					case 'email':
						if (!/^\S+\@\S+$/.test(value ?? '')) {
							return constraint.message ?? `This field must be a valid email`;
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
						}
						if (!isURL(value ?? '')) {
							return constraint.message ?? `This field must be a valid URL`;
						}
						break;
				}
				break;
			case 'pattern':
				if (!constraint.value.test(value ?? '')) {
					return constraint.message ?? `This field must be a valid format`;
				}
				break;
		}
	}

	return null;
}

export function parse<T>(
	payload: FormData | URLSearchParams | string,
	fieldsetCreator: ((value?: any) => Record<string, T>) | Record<string, T>,
): { data: Record<string, T>; error: Record<string, T> } {
	const iterable: Iterable<[string, FormDataEntryValue]> = payload instanceof URLSearchParams || payload instanceof FormData
		? payload : new URLSearchParams(payload);
	const data = unflatten(iterable);
	const fieldset = typeof fieldsetCreator === 'function' ? fieldsetCreator(data) : fieldsetCreator;
	const values = Object.fromEntries(iterable);
	const errors: Array<[string, string]> = [];

	for (const [name, field] of flatten(fieldset, f => typeof f.getConstraints === 'function')) {
		const constraints = field.getConstraints();
		const value = values[name];
		const message = validate(value, constraints);

		if (message) {
			errors.push([name, message]);
		}
	}

	return {
		data,
		error: errors.length > 0 ? unflatten(errors) : null,
	};
}