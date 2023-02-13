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

// type Join<K, P> = P extends string | number ?
//     K extends string | number ?
//     `${K}${"" extends P ? "" : "."}${P}`
//     : never : never;

// type DottedPaths<T> = T extends object ?
//     { [K in keyof T]-?: K extends string | number ?
//         `${K}` | Join<K, DottedPaths<T[K]>>
//         : never
//     }[keyof T] : ""

// type Pathfix<T> = T extends `${infer Prefix}.${number}${infer Postfix}` ? `${Prefix}[${number}]${Pathfix<Postfix>}` : T;

// type Path<Schema> = Pathfix<DottedPaths<Schema>> | '';

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
	name: '__intent__';
	value: string;
	formNoValidate?: boolean;
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

export function getFormElements(form: HTMLFormElement): FieldElement[] {
	return Array.from(form.elements).filter(isFieldElement);
}

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

export function shouldValidate(intent: string, name: string): boolean {
	switch (intent) {
		case 'submit':
		case 'validate':
		case `validate/${name}`:
			return true;
		default:
			return parseListCommand(intent)?.scope === name;
	}
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

export function reportSubmission(
	form: HTMLFormElement,
	submission: Submission,
): void {
	const listCommand = parseListCommand(submission.intent);

	if (listCommand) {
		form.dispatchEvent(
			new CustomEvent('conform/list', {
				detail: submission.intent,
			}),
		);
	}

	for (const name of Object.keys(submission.error)) {
		// We can't use empty string as button name
		// As `form.element.namedItem('')` will always returns null
		const elementName = name ? name : '__form__';
		let item = form.elements.namedItem(elementName);

		if (item instanceof RadioNodeList) {
			for (const field of item) {
				if ((field as FieldElement).type !== 'radio') {
					throw new Error('Repeated field name is not supported');
				}
			}
		}

		if (item === null) {
			// Create placeholder button to keep the error without contributing to the form data
			const button = document.createElement('button');

			button.name = elementName;
			button.hidden = true;
			button.dataset.conformTouched = 'true';
			item = button;

			form.appendChild(button);
		}
	}

	for (const element of form.elements) {
		if (isFieldElement(element) && element.willValidate) {
			const elementName = element.name !== '__form__' ? element.name : '';
			const message = submission.error[elementName];
			const elementShouldValidate = shouldValidate(
				submission.intent,
				elementName,
			);

			if (elementShouldValidate) {
				element.dataset.conformTouched = 'true';
			}

			if (typeof message !== 'undefined' || elementShouldValidate) {
				const invalidEvent = new Event('invalid', { cancelable: true });

				element.setCustomValidity(getValidationMessage(message));
				element.dispatchEvent(invalidEvent);
			}

			if (elementShouldValidate && !element.validity.valid) {
				focus(element);
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
 * The ponyfill of `HTMLFormElement.requestSubmit()`
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit
 * @see https://caniuse.com/?search=requestSubmit
 */
export function requestSubmit(
	form: HTMLFormElement,
	submitter?: HTMLButtonElement | HTMLInputElement,
): void {
	const submitEvent = new SubmitEvent('submit', {
		bubbles: true,
		cancelable: true,
		submitter,
	});

	form.dispatchEvent(submitEvent);
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

	button.name = '__intent__';
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
 * Returns the properties required to configure a command button for validation
 *
 * @see https://conform.guide/api/react#validate
 */
export function validate(field?: string): IntentButtonProps {
	return {
		name: '__intent__',
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

export function focus(field: FieldElement): void {
	const currentFocus = document.activeElement;

	if (
		!isFieldElement(currentFocus) ||
		currentFocus.tagName !== 'BUTTON' ||
		currentFocus.form !== field.form
	) {
		return;
	}

	field.focus();
}

export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: string,
		) => { value: Schema } | { error: Record<string, string | string[]> };
	},
): Submission<Schema>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: string,
		) => Promise<
			{ value: Schema } | { error: Record<string, string | string[]> }
		>;
	},
): Promise<Submission<Schema>>;
export function parse<Schema>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
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
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: string,
		) =>
			| ({ value: Schema } | { error: Record<string, string | string[]> })
			| Promise<
					{ value: Schema } | { error: Record<string, string | string[]> }
			  >;
	},
): Submission<Schema> | Promise<Submission<Schema>> {
	const submission: Submission = {
		intent: 'submit',
		payload: {},
		error: {},
	};

	for (let [name, value] of payload.entries()) {
		if (name === '__intent__') {
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

		// Cleanup
		result.error = Object.fromEntries(
			Object.entries(result.error).reduce<Array<[string, string | string[]]>>(
				(entries, [name, message]) => {
					if (shouldValidate(result.intent, name)) {
						if (Array.isArray(message)) {
							if (message.length > 0) {
								entries.push([name, message]);
							} else {
								entries.push([name, '']);
							}
						} else {
							entries.push([name, message]);
						}
					}

					return entries;
				},
				[],
			),
		);

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
 * Helpers to configure a command button for modifying a list
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
						name: '__intent__',
						value: `list/${type}/${scope}/${JSON.stringify(payload)}`,
						formNoValidate: true,
					};
				};
		}
	},
});
