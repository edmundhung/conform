export type Primitive = null | undefined | string | number | boolean | Date;

export type FieldElement =
	| HTMLInputElement
	| HTMLSelectElement
	| HTMLTextAreaElement
	| HTMLButtonElement;

export interface FieldConfig<Schema = unknown> extends FieldConstraint<Schema> {
	id?: string;
	name: string;
	defaultValue?: FieldValue<Schema>;
	initialError?: Record<string, string | string[]>;
	form?: string;
	errorId?: string;

	/**
	 * The frist error of the field
	 */
	error?: string;

	/**
	 * All of the field errors
	 */
	errors?: string[];
}

export type FieldValue<Schema> = Schema extends Primitive
	? string
	: Schema extends File
	? File
	: Schema extends Array<infer InnerType>
	? Array<FieldValue<InnerType>>
	: Schema extends Record<string, any>
	? { [Key in keyof Schema]?: FieldValue<Schema[Key]> }
	: any;

export type FieldConstraint<Schema = any> = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: Schema extends number ? number : string | number;
	max?: Schema extends number ? number : string | number;
	step?: Schema extends number ? number : string | number;
	multiple?: boolean;
	pattern?: string;
};

export type FieldsetConstraint<Schema extends Record<string, any>> = {
	[Key in keyof Schema]?: FieldConstraint<Schema[Key]>;
};

export type Submission<Schema extends Record<string, any> | unknown = unknown> =
	unknown extends Schema
		? {
				intent: string;
				payload: Record<string, any>;
				error: Record<string, string | string[]>;
		  }
		: {
				intent: string;
				payload: Record<string, any>;
				value?: Schema;
				error: Record<string, string | string[]>;
				toJSON(): Submission;
		  };

export interface IntentButtonProps {
	name: typeof INTENT;
	value: string;
	formNoValidate?: boolean;
}

/**
 * Check if the provided reference is a form element (_input_ / _select_ / _textarea_ or _button_)
 */
export function isFieldElement(element: unknown): element is FieldElement {
	return (
		element instanceof Element &&
		(element.tagName === 'INPUT' ||
			element.tagName === 'SELECT' ||
			element.tagName === 'TEXTAREA' ||
			element.tagName === 'BUTTON')
	);
}

/**
 * Find the corresponding paths based on the formatted name
 * @param name formatted name
 * @returns paths
 */
export function getPaths(name: string): Array<string | number> {
	const pattern = /(\w*)\[(\d+)\]/;

	if (!name) {
		return [];
	}

	return name.split('.').flatMap((key) => {
		const matches = pattern.exec(key);

		if (!matches) {
			return key;
		}

		if (matches[1] === '') {
			return Number(matches[2]);
		}

		return [matches[1], Number(matches[2])];
	});
}

export function getFormData(
	form: HTMLFormElement,
	submitter?: HTMLInputElement | HTMLButtonElement | null,
): FormData {
	const payload = new FormData(form);

	if (submitter?.name) {
		payload.append(submitter.name, submitter.value);
	}

	return payload;
}

export type FormMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type FormEncType =
	| 'application/x-www-form-urlencoded'
	| 'multipart/form-data';

export function getFormAttributes(
	form: HTMLFormElement,
	submitter?: HTMLInputElement | HTMLButtonElement | null,
): {
	action: string;
	encType: FormEncType;
	method: FormMethod;
} {
	const enforce = <Type extends string>(value: string, list: Type[]): Type =>
		list.includes(value as Type) ? (value as Type) : list[0];
	const action =
		submitter?.getAttribute('formaction') ??
		form.getAttribute('action') ??
		`${location.pathname}${location.search}`;
	const method =
		submitter?.getAttribute('formmethod') ??
		form.getAttribute('method') ??
		'get';
	const encType = submitter?.getAttribute('formenctype') ?? form.enctype;

	return {
		action,
		encType: enforce<FormEncType>(encType, [
			'application/x-www-form-urlencoded',
			'multipart/form-data',
		]),
		method: enforce<FormMethod>(method, [
			'get',
			'post',
			'put',
			'patch',
			'delete',
		]),
	};
}

export function getName(paths: Array<string | number>): string {
	return paths.reduce<string>((name, path) => {
		if (typeof path === 'number') {
			return `${name}[${path}]`;
		}

		if (name === '' || path === '') {
			return [name, path].join('');
		}

		return [name, path].join('.');
	}, '');
}

export function getScope(intent: string): string | null {
	const [type, ...rest] = intent.split('/');

	switch (type) {
		case 'validate':
			return rest.length > 0 ? rest.join('/') : null;
		case 'list':
			return parseListCommand(intent)?.scope ?? null;
		default:
			return null;
	}
}

export function isFocusedOnIntentButton(
	form: HTMLFormElement,
	intent: string,
): boolean {
	const element = document.activeElement;

	return (
		isFieldElement(element) &&
		element.tagName === 'BUTTON' &&
		element.form === form &&
		element.name === INTENT &&
		element.value === intent
	);
}

export function getValidationMessage(errors?: string | string[]): string {
	return ([] as string[]).concat(errors ?? []).join(String.fromCharCode(31));
}

export function getErrors(message: string | undefined): string[] {
	if (!message) {
		return [];
	}

	return message.split(String.fromCharCode(31));
}

const FORM_ERROR_ELEMENT_NAME = '__form__';
export const INTENT = '__intent__';
export const VALIDATION_UNDEFINED = '__undefined__';
export const VALIDATION_SKIPPED = '__skipped__';

export function reportSubmission(
	form: HTMLFormElement,
	submission: Submission,
): void {
	for (const [name, message] of Object.entries(submission.error)) {
		// There is no need to create a placeholder button if all we want is to reset the error
		if (message === '') {
			continue;
		}

		// We can't use empty string as button name
		// As `form.element.namedItem('')` will always returns null
		const elementName = name ? name : FORM_ERROR_ELEMENT_NAME;
		const item = form.elements.namedItem(elementName);

		if (item instanceof RadioNodeList) {
			for (const field of item) {
				if ((field as FieldElement).type !== 'radio') {
					console.warn('Repeated field name is not supported.');
					continue;
				}
			}
		}

		if (item === null) {
			// Create placeholder button to keep the error without contributing to the form data
			const button = document.createElement('button');

			button.name = elementName;
			button.hidden = true;
			button.dataset.conformTouched = 'true';

			form.appendChild(button);
		}
	}

	let focusedFirstInvalidField = false;
	const scope = getScope(submission.intent);
	const isSubmitting =
		submission.intent.slice(0, submission.intent.indexOf('/')) !== 'validate' &&
		parseListCommand(submission.intent) === null;

	for (const element of form.elements) {
		if (isFieldElement(element) && element.willValidate) {
			const elementName =
				element.name !== FORM_ERROR_ELEMENT_NAME ? element.name : '';
			const messages = ([] as string[]).concat(
				submission.error[elementName] ?? [],
			);
			const shouldValidate = scope === null || scope === elementName;

			if (shouldValidate) {
				element.dataset.conformTouched = 'true';
			}

			if (
				!messages.includes(VALIDATION_SKIPPED) &&
				!messages.includes(VALIDATION_UNDEFINED)
			) {
				const invalidEvent = new Event('invalid', { cancelable: true });

				element.setCustomValidity(getValidationMessage(messages));
				element.dispatchEvent(invalidEvent);
			}

			if (
				!focusedFirstInvalidField &&
				(isSubmitting || isFocusedOnIntentButton(form, submission.intent)) &&
				shouldValidate &&
				element.tagName !== 'BUTTON' &&
				!element.validity.valid
			) {
				element.focus();
				focusedFirstInvalidField = true;
			}
		}
	}
}

export function setValue<T>(
	target: any,
	paths: Array<string | number>,
	valueFn: (prev?: T) => T,
): void {
	let length = paths.length;
	let lastIndex = length - 1;
	let index = -1;
	let pointer = target;

	while (pointer != null && ++index < length) {
		let key = paths[index];
		let next = paths[index + 1];
		let newValue =
			index != lastIndex
				? pointer[key] ?? (typeof next === 'number' ? [] : {})
				: valueFn(pointer[key]);

		pointer[key] = newValue;
		pointer = pointer[key];
	}
}

/**
 * Creates an intent button on demand and trigger a form submit by clicking it.
 */
export function requestIntent(
	form: HTMLFormElement | undefined,
	buttonProps: {
		value: string;
		formNoValidate?: boolean;
	},
): void {
	if (!form) {
		console.warn('No form element is provided');
		return;
	}

	const button = document.createElement('button');

	button.name = INTENT;
	button.value = buttonProps.value;
	button.hidden = true;

	if (buttonProps.formNoValidate) {
		button.formNoValidate = true;
	}

	form.appendChild(button);
	button.click();
	form.removeChild(button);
}

/**
 * Returns the properties required to configure an intent button for validation
 *
 * @see https://conform.guide/api/react#validate
 */
export function validate(field?: string): IntentButtonProps {
	return {
		name: INTENT,
		value: field ? `validate/${field}` : 'validate',
		formNoValidate: true,
	};
}

export function getFormElement(
	element:
		| HTMLFormElement
		| HTMLFieldSetElement
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| HTMLButtonElement
		| null,
): HTMLFormElement | null {
	const form = element instanceof HTMLFormElement ? element : element?.form;

	if (!form) {
		return null;
	}

	return form;
}

export function parse(payload: FormData | URLSearchParams): Submission;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) => { value: Schema } | { error: Record<string, string | string[]> };
	},
): Submission<Schema>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) => Promise<
			{ value: Schema } | { error: Record<string, string | string[]> }
		>;
	},
): Promise<Submission<Schema>>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) =>
			| ({ value: Schema } | { error: Record<string, string | string[]> })
			| Promise<
					{ value: Schema } | { error: Record<string, string | string[]> }
			  >;
	},
): Submission<Schema> | Promise<Submission<Schema>>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options?: {
		resolve?: (
			payload: Record<string, any>,
			intent: string,
		) =>
			| ({ value: Schema } | { error: Record<string, string | string[]> })
			| Promise<
					{ value: Schema } | { error: Record<string, string | string[]> }
			  >;
	},
): Submission | Submission<Schema> | Promise<Submission<Schema>> {
	const submission: Submission = {
		intent: 'submit',
		payload: {},
		error: {},
	};

	for (let [name, value] of payload.entries()) {
		if (name === INTENT) {
			if (typeof value !== 'string' || submission.intent !== 'submit') {
				throw new Error('The intent could only be set on a button');
			}

			submission.intent = value;
		} else {
			const paths = getPaths(name);

			setValue(submission.payload, paths, (prev) => {
				if (!prev) {
					return value;
				} else if (Array.isArray(prev)) {
					return prev.concat(value);
				} else {
					return [prev, value];
				}
			});
		}
	}

	const command = parseListCommand(submission.intent);

	if (command) {
		const paths = getPaths(command.scope);

		setValue(submission.payload, paths, (list) => {
			if (typeof list !== 'undefined' && !Array.isArray(list)) {
				throw new Error('The list command can only be applied to a list');
			}

			return updateList(list ?? [], command);
		});
	}

	if (typeof options?.resolve === 'undefined') {
		return submission;
	}

	const result = options.resolve(submission.payload, submission.intent);
	const mergeResolveResult = (
		resolved: { error: Record<string, string | string[]> } | { value: Schema },
	) => {
		const result = {
			...submission,
			...resolved,
			toJSON() {
				return {
					intent: this.intent,
					payload: this.payload,
					error: this.error,
				};
			},
		};

		return result;
	};

	if (result instanceof Promise) {
		return result.then<Submission<Schema>>(mergeResolveResult);
	}

	return mergeResolveResult(result);
}

export type ListCommand<Schema = unknown> =
	| { type: 'prepend'; scope: string; payload: { defaultValue: Schema } }
	| { type: 'append'; scope: string; payload: { defaultValue: Schema } }
	| {
			type: 'replace';
			scope: string;
			payload: { defaultValue: Schema; index: number };
	  }
	| { type: 'remove'; scope: string; payload: { index: number } }
	| { type: 'reorder'; scope: string; payload: { from: number; to: number } };

export function parseListCommand<Schema = unknown>(
	intent: string,
): ListCommand<Schema> | null {
	try {
		const [group, type, scope, json] = intent.split('/');

		if (
			group !== 'list' ||
			!['prepend', 'append', 'replace', 'remove', 'reorder'].includes(type) ||
			!scope
		) {
			return null;
		}

		const payload = JSON.parse(json);

		return {
			// @ts-expect-error
			type,
			scope,
			payload,
		};
	} catch (error) {
		return null;
	}
}

export function updateList<Schema>(
	list: Array<Schema>,
	command: ListCommand<Schema>,
): Array<Schema> {
	switch (command.type) {
		case 'prepend': {
			list.unshift(command.payload.defaultValue);
			break;
		}
		case 'append': {
			list.push(command.payload.defaultValue);
			break;
		}
		case 'replace': {
			list.splice(command.payload.index, 1, command.payload.defaultValue);
			break;
		}
		case 'remove':
			list.splice(command.payload.index, 1);
			break;
		case 'reorder':
			list.splice(
				command.payload.to,
				0,
				...list.splice(command.payload.from, 1),
			);
			break;
		default:
			throw new Error('Unknown list command received');
	}

	return list;
}

export interface ListCommandButtonBuilder {
	append<Schema>(
		name: string,
		payload?: { defaultValue: Schema },
	): IntentButtonProps;
	prepend<Schema>(
		name: string,
		payload?: { defaultValue: Schema },
	): IntentButtonProps;
	replace<Schema>(
		name: string,
		payload: { defaultValue: Schema; index: number },
	): IntentButtonProps;
	remove(name: string, payload: { index: number }): IntentButtonProps;
	reorder(
		name: string,
		payload: { from: number; to: number },
	): IntentButtonProps;
}

/**
 * Helpers to configure an intent button for modifying a list
 *
 * @see https://conform.guide/api/react#list
 */
export const list = new Proxy({} as ListCommandButtonBuilder, {
	get(_target, type: any) {
		switch (type) {
			case 'append':
			case 'prepend':
			case 'replace':
			case 'remove':
			case 'reorder':
				return (scope: string, payload = {}): IntentButtonProps => {
					return {
						name: INTENT,
						value: `list/${type}/${scope}/${JSON.stringify(payload)}`,
						formNoValidate: true,
					};
				};
		}
	},
});

/**
 * Validate the form with the Constraint Validation API
 * @see https://conform.guide/api/react#validateconstraint
 */
export function validateConstraint(options: {
	form: HTMLFormElement;
	formData?: FormData;
	constraint?: Record<
		Lowercase<string>,
		(
			value: string,
			context: { formData: FormData; attributeValue: string },
		) => boolean
	>;
	acceptMultipleErrors?: ({
		name,
		intent,
		payload,
	}: {
		name: string;
		intent: string;
		payload: Record<string, any>;
	}) => boolean;
	formatMessages?: ({
		name,
		validity,
		constraint,
		defaultErrors,
	}: {
		name: string;
		validity: ValidityState;
		constraint: Record<string, boolean>;
		defaultErrors: string[];
	}) => string[];
}): Submission {
	const formData = options?.formData ?? new FormData(options.form);
	const getDefaultErrors = (
		validity: ValidityState,
		result: Record<string, boolean>,
	) => {
		const errors: Array<string> = [];

		if (validity.valueMissing) errors.push('required');
		if (validity.typeMismatch || validity.badInput) errors.push('type');
		if (validity.tooShort) errors.push('minLength');
		if (validity.rangeUnderflow) errors.push('min');
		if (validity.stepMismatch) errors.push('step');
		if (validity.tooLong) errors.push('maxLength');
		if (validity.rangeOverflow) errors.push('max');
		if (validity.patternMismatch) errors.push('pattern');

		for (const [constraintName, valid] of Object.entries(result)) {
			if (!valid) {
				errors.push(constraintName);
			}
		}

		return errors;
	};
	const formatMessages =
		options?.formatMessages ?? (({ defaultErrors }) => defaultErrors);

	return parse(formData, {
		resolve(payload, intent) {
			const error: Record<string, string | string[]> = {};
			const constraintPattern = /^constraint[A-Z][^A-Z]*$/;
			for (const element of options.form.elements) {
				if (isFieldElement(element)) {
					const name =
						element.name !== FORM_ERROR_ELEMENT_NAME ? element.name : '';
					const constraint = Object.entries(element.dataset).reduce<
						Record<string, boolean>
					>((result, [name, attributeValue = '']) => {
						if (constraintPattern.test(name)) {
							const constraintName = name
								.slice(10)
								.toLowerCase() as Lowercase<string>;
							const validate = options.constraint?.[constraintName];

							if (typeof validate === 'function') {
								result[constraintName] = validate(element.value, {
									formData,
									attributeValue,
								});
							} else {
								console.warn(
									`Found an "${constraintName}" constraint with undefined definition; Please specify it on the validateConstraint API.`,
								);
							}
						}

						return result;
					}, {});
					const errors = formatMessages({
						name,
						validity: element.validity,
						constraint,
						defaultErrors: getDefaultErrors(element.validity, constraint),
					});
					const shouldAcceptMultipleErrors =
						options?.acceptMultipleErrors?.({
							name,
							payload,
							intent,
						}) ?? false;

					if (errors.length > 0) {
						error[name] = shouldAcceptMultipleErrors ? errors : errors[0];
					}
				}
			}

			return { error };
		},
	});
}
