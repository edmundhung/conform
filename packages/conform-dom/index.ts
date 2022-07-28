export type Constraint = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: string | number;
	max?: string | number;
	step?: string;
	multiple?: boolean;
	pattern?: string;
};

export interface FieldProps<Type = any> extends Constraint {
	name: string;
	defaultValue?: FieldsetData<Type, string>;
	error?: FieldsetData<Type, string>;
	form?: string;
}

export type Schema<Type extends Record<string, any>> = {
	fields: { [Key in keyof Type]-?: Constraint };
	validate?: (element: HTMLFieldSetElement) => void;
};

/**
 * Data structure of the form value
 */
export type FieldsetData<Type, Value> = Type extends
	| string
	| number
	| Date
	| boolean
	| undefined
	? Value
	: Type extends Array<infer InnerType>
	? Array<FieldsetData<InnerType, Value>>
	: Type extends Object
	? { [Key in keyof Type]?: FieldsetData<Type[Key], Value> }
	: unknown;

/**
 * Element type that might be a candiate of Constraint Validation
 */
export type FieldElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
	| HTMLButtonElement;

export interface FormState<T> {
	value: FieldsetData<T, string>;
	error: FieldsetData<T, string>;
}

export type Submission<T extends Record<string, unknown>> =
	| {
			state: 'modified';
			form: FormState<T>;
	  }
	| {
			state: 'rejected';
			form: FormState<T>;
	  }
	| {
			state: 'accepted';
			data: T;
			form: FormState<T>;
	  };

export interface ControlButtonProps {
	type: 'submit';
	name: string;
	value: string;
	formNoValidate: boolean;
}

export interface ControlAction<T = unknown> {
	prepend: { defaultValue: T };
	append: { defaultValue: T };
	replace: { defaultValue: T; index: number };
	remove: { index: number };
	reorder: { from: number; to: number };
}

export function isFieldElement(element: unknown): element is FieldElement {
	return (
		element instanceof Element &&
		(element.tagName === 'INPUT' ||
			element.tagName === 'SELECT' ||
			element.tagName === 'TEXTAREA' ||
			element.tagName === 'BUTTON')
	);
}

export function getFieldProps<Type extends Record<string, any>>(
	schema: Schema<Type>,
	options: {
		name?: string;
		form?: string;
		defaultValue?: FieldsetData<Type, string>;
		error?: FieldsetData<Type, string>;
	},
): { [Key in keyof Type]-?: FieldProps<Type[Key]> } {
	const result: { [Key in keyof Type]-?: FieldProps<Type[Key]> } = {} as any;

	for (const key of Object.keys(schema.fields)) {
		const constraint = schema.fields[key];
		const props: FieldProps<any> = {
			name: options.name ? `${options.name}.${key}` : key,
			form: options.form,
			defaultValue: options.defaultValue?.[key],
			error: options.error?.[key],
			...constraint,
		};

		result[key as keyof Type] = props;
	}

	return result;
}

export function getPaths(name?: string): Array<string | number> {
	const pattern = /(\w+)\[(\d+)\]/;

	if (!name) {
		return [];
	}

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

export function getFieldsetData(
	fieldset: HTMLFieldSetElement,
): FieldsetData<Record<string, unknown>, string> {
	const entries: Array<[string, FormDataEntryValue]> = [];

	if (fieldset.form) {
		const formData = new FormData(fieldset.form);

		for (const [key, value] of formData) {
			if (!fieldset.name || key.startsWith(`${fieldset.name}.`)) {
				entries.push([
					key.slice(fieldset.name ? fieldset.name.length + 1 : 0),
					value,
				]);
			}
		}
	}

	return transform(entries);
}

export function setFieldsetError(
	fieldset: HTMLFieldSetElement,
	keys: string[],
	errors: Array<[string, string]>,
) {
	const firstErrorByName = Object.fromEntries([...errors].reverse());

	for (const element of fieldset.elements) {
		if (!isFieldElement(element)) {
			continue;
		}

		const key = getKey(fieldset, element);

		if (key !== null && keys.includes(key)) {
			element.setCustomValidity(firstErrorByName[element.name] ?? '');
		}
	}
}

export function getKey(
	fieldset: HTMLFieldSetElement,
	element: FieldElement,
): string | null {
	if (fieldset.form !== element.form) {
		return null;
	}

	const name =
		fieldset.name === '' || element.name.startsWith(fieldset.name)
			? element.name.slice(fieldset.name ? fieldset.name.length + 1 : 0)
			: '';
	const [key] = getPaths(name);

	return typeof key === 'string' ? key : null;
}

export function transform(
	entries:
		| Array<[string, FormDataEntryValue]>
		| Iterable<[string, FormDataEntryValue]>,
): Record<string, unknown> {
	const result: any = {};

	for (let [key, value] of entries) {
		if (value === '') {
			continue;
		}

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

export function getControlButtonProps<
	Action extends keyof ControlAction,
	Payload extends ControlAction[Action],
>(name: string, action: Action, payload: Payload): ControlButtonProps {
	return {
		type: 'submit',
		name: '__conform__',
		value: [name, action, JSON.stringify(payload)].join('::'),
		formNoValidate: true,
	};
}

export function applyControlCommand<
	Type,
	Action extends keyof ControlAction<Type>,
	Payload extends ControlAction<Type>[Action],
>(list: Array<Type>, action: Action | string, payload: Payload): Array<Type> {
	switch (action) {
		case 'prepend': {
			const { defaultValue } = payload as ControlAction<Type>['prepend'];
			list.unshift(defaultValue);
			break;
		}
		case 'append': {
			const { defaultValue } = payload as ControlAction<Type>['append'];
			list.push(defaultValue);
			break;
		}
		case 'replace': {
			const { defaultValue, index } = payload as ControlAction<Type>['replace'];
			list.splice(index, 1, defaultValue);
			break;
		}
		case 'remove':
			const { index } = payload as ControlAction<Type>['remove'];
			list.splice(index, 1);
			break;
		case 'reorder':
			const { from, to } = payload as ControlAction<Type>['reorder'];
			list.splice(to, 0, ...list.splice(from, 1));
			break;
		default:
			throw new Error('Invalid action found');
	}

	return list;
}

export function parse(
	payload: FormData | URLSearchParams,
): Submission<Record<string, unknown>> {
	const command = payload.get('__conform__');

	if (command) {
		payload.delete('__conform__');
	}

	const value = transform(payload.entries());

	if (command) {
		try {
			if (command instanceof File) {
				throw new Error(
					'The __conform__ key is reserved for special command and could not be used for file upload.',
				);
			}

			const [name, action, json] = command.split('::');

			let list: any = value;

			for (let path of getPaths(name)) {
				list = list[path];

				if (typeof list === 'undefined') {
					break;
				}
			}

			if (!Array.isArray(list)) {
				throw new Error('');
			}

			applyControlCommand(list, action, JSON.parse(json));
		} catch (e) {
			return {
				state: 'rejected',
				form: {
					value,
					error: {
						__conform__:
							e instanceof Error ? e.message : 'Something went wrong',
					},
				},
			};
		}

		return {
			state: 'modified',
			form: {
				value,
				error: {},
			},
		};
	}

	return {
		state: 'accepted',
		data: value,
		form: {
			value,
			error: {},
		},
	};
}

export function subscribeFieldset(
	fieldset: HTMLFieldSetElement,
	{ fields, validate, initialReport, onReport }: any,
) {
	if (!fieldset.form) {
		console.warn(
			'No form element is linked to the fieldset; Do you forgot setting the form attribute?',
		);
	}

	const keys = Object.keys(fields);
	const isRelatedField = (element: FieldElement): boolean => {
		const key = getKey(fieldset, element);

		return key !== null && keys.includes(key);
	};
	const inputHandler = (event: Event) => {
		if (!isFieldElement(event.target) || !isRelatedField(event.target)) {
			return;
		}

		validate?.(fieldset);

		for (const element of fieldset.elements) {
			if (!isFieldElement(element)) {
				continue;
			}

			const key = getKey(fieldset, element);

			if (key) {
				if (element.validationMessage === '') {
					onReport(key, '');
				}

				if (element.dataset.conformTouched) {
					element.reportValidity();
				}
			}
		}

		if (initialReport === 'onChange') {
			event.target.dataset.conformTouched = 'true';
		}
	};
	const invalidHandler = (event: Event) => {
		if (!isFieldElement(event.target)) {
			return;
		}

		const key = getKey(fieldset, event.target);

		if (key !== null && keys.includes(key)) {
			onReport(key, event.target.validationMessage);

			// Disable browser report
			event.preventDefault();
		}
	};
	const blurHandler = (event: FocusEvent) => {
		if (!isFieldElement(event.target)) {
			return;
		}

		const key = getKey(fieldset, event.target);

		if (key !== null && keys.includes(key)) {
			for (const element of fieldset.elements) {
				if (
					isFieldElement(element) &&
					isRelatedField(element) &&
					element.dataset.conformTouched
				) {
					element.reportValidity();
				}
			}

			if (initialReport === 'onBlur') {
				event.target.dataset.conformTouched = 'true';
			}
		}
	};
	const clickHandler = (event: MouseEvent) => {
		if (
			!isFieldElement(event.target) ||
			event.target?.form !== fieldset?.form ||
			event.defaultPrevented
		) {
			return;
		}

		if (event.target.type === 'submit') {
			for (const element of fieldset.elements) {
				if (isFieldElement(element) && isRelatedField(element)) {
					element.dataset.conformTouched = 'true';
				}
			}
		}
	};
	const resetHandler = (event: Event) => {
		if (event.target !== fieldset.form) {
			return;
		}

		for (const element of fieldset.elements) {
			if (!isFieldElement(element)) {
				continue;
			}

			const key = getKey(fieldset, element);

			if (key !== null && keys.includes(key)) {
				delete element.dataset.conformTouched;
				onReport(key, '');
			}
		}

		// Revalidate the fieldset after form reset
		setTimeout(() => {
			validate?.(fieldset);
		}, 0);
	};

	validate?.(fieldset);

	document.addEventListener('input', inputHandler, true);
	document.addEventListener('blur', blurHandler, true);
	document.addEventListener('invalid', invalidHandler, true);
	document.addEventListener('click', clickHandler);
	document.addEventListener('reset', resetHandler);

	return () => {
		document.removeEventListener('input', inputHandler, true);
		document.removeEventListener('blur', blurHandler, true);
		document.removeEventListener('invalid', invalidHandler, true);
		document.removeEventListener('click', clickHandler);
		document.removeEventListener('reset', resetHandler);
	};
}
