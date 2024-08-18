export type Submission<Intent> = {
	fields: string[];
	submittedValue: Record<string, any>;
	value: Record<string, any> | null;
	intent: Intent | null;
};

export type SubmissionResult<Intent, ErrorShape> = {
	type: 'client' | 'server';
	fields: string[];
	submittedValue: Record<string, any>;
	intent: Intent;
	errors: Record<string, ErrorShape>;
};

export type DefaultValue<Schema> = Schema extends
	| string
	| number
	| boolean
	| Date
	| File
	| bigint
	| null
	| undefined
	? Schema | null | undefined
	: Schema extends Array<infer Item> | null | undefined
		? Array<DefaultValue<Item>> | null | undefined
		: Schema extends Record<string, any> | null | undefined
			? { [Key in keyof Schema]?: DefaultValue<Schema[Key]> } | null | undefined
			: unknown;

export type FormValue<Schema> = Schema extends
	| string
	| number
	| boolean
	| Date
	| bigint
	| null
	| undefined
	? Schema extends string | number | boolean | Date | bigint
		? string | undefined
		: undefined
	: Schema extends File
		? File | undefined
		: Schema extends File[]
			? Array<File> | undefined
			: Schema extends Array<infer Item>
				? Array<FormValue<Item>> | undefined
				: Schema extends Record<string, any>
					?
							| { [Key in keyof Schema]?: FormValue<Schema[Key]> }
							| null
							| undefined
					: unknown;

export type FormState<Schema, ErrorShape> = {
	defaultValue: DefaultValue<Schema> | null;
	serverError: Record<string, ErrorShape> | null;
	clientError: Record<string, ErrorShape>;
	keyByPath: Record<string, string>;
	initialValue: Record<string, any>;
	submittedValue: Record<string, any> | null;
	touched: string[];
};

export function isPlainObject(
	obj: unknown,
): obj is Record<string | number | symbol, unknown> {
	return (
		!!obj &&
		obj.constructor === Object &&
		Object.getPrototypeOf(obj) === Object.prototype
	);
}

export function serialize<Schema>(value: Schema): FormValue<Schema> {
	if (isPlainObject(value)) {
		// @ts-expect-error FIXME
		return Object.entries(value).reduce<Record<string, unknown>>(
			(result, [key, value]) => {
				result[key] = serialize(value);
				return result;
			},
			{},
		);
	} else if (Array.isArray(value)) {
		// @ts-expect-error FIXME
		return value.map(serialize);
	} else if (value instanceof Date) {
		// @ts-expect-error FIXME
		return value.toISOString();
	} else if (typeof value === 'boolean') {
		// @ts-expect-error FIXME
		return value ? 'on' : undefined;
	} else if (typeof value === 'number' || typeof value === 'bigint') {
		// @ts-expect-error FIXME
		return value.toString();
	} else {
		// @ts-expect-error FIXME
		return value ?? undefined;
	}
}

export function generateId(): string {
	return Math.floor(Date.now() * Math.random()).toString(36);
}

/**
 * Flatten a tree into a dictionary
 */
export function flatten<Value>(
	data: unknown,
	options: {
		select: (value: unknown) => Value;
		prefix?: string;
	},
): Record<string, NonNullable<Value>> {
	const result: Record<string, NonNullable<Value>> = {};

	function process(data: unknown, prefix: string) {
		const value = options.select(data);

		if (typeof value !== 'undefined' && value !== null) {
			result[prefix] = value;
		}

		if (Array.isArray(data)) {
			for (let i = 0; i < data.length; i++) {
				process(data[i], `${prefix}[${i}]`);
			}
		} else if (isPlainObject(data)) {
			for (const [key, value] of Object.entries(data)) {
				process(value, prefix ? `${prefix}.${key}` : key);
			}
		}
	}

	if (data) {
		process(data, options.prefix ?? '');
	}

	return result;
}

/**
 * Returns the paths from a name based on the JS syntax convention
 * @example
 * ```js
 * const paths = getPaths('todos[0].content'); // ['todos', 0, 'content']
 * ```
 */
export function getPaths(name: string | undefined): Array<string | number> {
	if (!name) {
		return [];
	}

	return name
		.split(/\.|(\[\d*\])/)
		.reduce<Array<string | number>>((result, segment) => {
			if (
				typeof segment !== 'undefined' &&
				segment !== '' &&
				segment !== '__proto__' &&
				segment !== 'constructor' &&
				segment !== 'prototype'
			) {
				if (segment.startsWith('[') && segment.endsWith(']')) {
					const index = segment.slice(1, -1);

					result.push(Number(index));
				} else {
					result.push(segment);
				}
			}
			return result;
		}, []);
}

/**
 * Returns a formatted name from the paths based on the JS syntax convention
 * @example
 * ```js
 * const name = formatPaths(['todos', 0, 'content']); // "todos[0].content"
 * ```
 */
export function formatPaths(paths: Array<string | number>): string {
	return paths.reduce<string>((name, path) => {
		if (typeof path === 'number') {
			return `${name}[${Number.isNaN(path) ? '' : path}]`;
		}

		if (name === '' || path === '') {
			return [name, path].join('');
		}

		return [name, path].join('.');
	}, '');
}

/**
 * Check if a name match the prefix paths
 */
export function isPrefix(name: string, prefix: string) {
	if (name === prefix) {
		return true;
	}

	const paths = getPaths(name);
	const prefixPaths = getPaths(prefix);

	return (
		paths.length > prefixPaths.length &&
		prefixPaths.every((path, index) => paths[index] === path)
	);
}

/**
 * Format based on a prefix and a path
 */
export function formatName(prefix: string | undefined, path?: string | number) {
	return typeof path !== 'undefined'
		? formatPaths([...getPaths(prefix), path])
		: prefix ?? '';
}

type NameBuilder<Schema> = {
	$name: string;
} & (Schema extends Array<infer Item>
	? (index: number) => NameBuilder<Item>
	: Schema extends Record<string, any>
		? {
				[key in keyof Schema]-?: NameBuilder<Schema[key]>;
			}
		: {});

export function createNameBuilder<Schema>(
	prefix?: string,
): NameBuilder<Schema> {
	// @ts-expect-error The proxy will extend the object
	return new Proxy(
		Object.assign(
			(number: number) => createNameBuilder(formatName(prefix, number)),
			{
				$name: prefix ?? '',
			},
		),
		{
			get(target, key, receiver) {
				if (Object.prototype.hasOwnProperty.call(target, key)) {
					return Reflect.get(target, key, receiver);
				}

				if (typeof key !== 'string') {
					return;
				}

				return createNameBuilder(formatName(prefix, key));
			},
		},
	);
}

export function createKey(
	defaultValue: unknown,
	prefix: string = '',
	currentKey: Record<string, string> = {},
): Record<string, string> {
	const initialKey = prefix
		? mapKeys(currentKey, (key) => (!isPrefix(key, prefix) ? key : null))
		: {};
	const result = Object.entries(
		flatten(defaultValue, {
			select(value) {
				return Array.isArray(value) ? value : null;
			},
			prefix,
		}),
	).reduce<Record<string, string>>((result, [key, value]) => {
		for (let i = 0; i < value.length; i++) {
			result[formatName(key, i)] = generateId();
		}

		return result;
	}, initialKey);

	result[prefix] = generateId();

	return result;
}

export type SubmissionIntent<Payload, Type = string> = undefined extends Payload
	? { type: Type; payload?: Payload }
	: { type: Type; payload: Payload };

export type FormControl<Payload> = {
	serialize(payload: Payload): string;
	deserialize(value: string): Payload;
	onParse?(
		value: Record<string, unknown>,
		payload: Payload,
	): Record<string, unknown> | null;
	onSubmit<Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape>,
		context: {
			result: SubmissionResult<SubmissionIntent<Payload>, ErrorShape>;
			reset: () => FormState<Schema, ErrorShape>;
		},
	): FormState<Schema, ErrorShape>;
};

export function deepEqual<Value>(prev: Value, next: Value): boolean {
	if (prev === next) {
		return true;
	}

	if (!prev || !next) {
		return false;
	}

	if (Array.isArray(prev) && Array.isArray(next)) {
		if (prev.length !== next.length) {
			return false;
		}

		for (let i = 0; i < prev.length; i++) {
			if (!deepEqual(prev[i], next[i])) {
				return false;
			}
		}

		return true;
	}

	if (isPlainObject(prev) && isPlainObject(next)) {
		const prevKeys = Object.keys(prev);
		const nextKeys = Object.keys(next);

		if (prevKeys.length !== nextKeys.length) {
			return false;
		}

		for (const key of prevKeys) {
			if (
				!Object.prototype.hasOwnProperty.call(next, key) ||
				// @ts-expect-error FIXME
				!deepEqual(prev[key], next[key])
			) {
				return false;
			}
		}

		return true;
	}

	return false;
}

/**
 * Retrive the value from a target object by following the paths
 */
export function getValue(target: unknown, name: string): unknown {
	let pointer = target;

	for (const path of getPaths(name)) {
		if (typeof pointer === 'undefined' || pointer == null) {
			break;
		}

		if (!Object.prototype.hasOwnProperty.call(pointer, path)) {
			return;
		}

		if (isPlainObject(pointer) && typeof path === 'string') {
			pointer = pointer[path];
		} else if (Array.isArray(pointer) && typeof path === 'number') {
			pointer = pointer[path];
		} else {
			throw new Error(
				`Failed to access the value; The path ${path} from ${name} is invalid`,
			);
		}
	}

	return pointer;
}

/**
 * Assign a value to a target object by following the paths
 */
export function setValue<Target extends Record<string, any>>(
	target: Target,
	name: string,
	value: unknown | ((currentValue?: unknown) => unknown),
	mutate?: boolean,
): Target {
	if (name === '') {
		if (mutate) {
			throw new Error('Cannot mutate the object root');
		}

		return typeof value === 'function' ? value(target) : value;
	}

	const paths = getPaths(name);
	const length = paths.length;
	const lastIndex = length - 1;
	const result = mutate ? target : Object.assign({}, target);

	let index = -1;
	let pointer: any = result;

	while (pointer !== null && ++index < length) {
		const key = paths[index] as string | number;
		const nextKey = paths[index + 1];
		const newValue =
			index != lastIndex
				? Object.prototype.hasOwnProperty.call(pointer, key) &&
					pointer[key] !== null
					? mutate
						? pointer[key]
						: Array.isArray(pointer[key])
							? Array.from(pointer[key])
							: Object.assign({}, pointer[key])
					: typeof nextKey === 'number'
						? []
						: {}
				: typeof value === 'function'
					? value(pointer[key])
					: value;

		pointer[key] = newValue;
		pointer = pointer[key];
	}

	return result;
}

export function modifyNestedData<Value extends Record<string, any>>(
	value: Value,
	data: unknown,
	name: string,
): Value {
	const currentData = getValue(value, name);

	if (deepEqual(currentData, data)) {
		return value;
	}

	return setValue(value, name, data);
}

export function merge<State extends Record<string, any>>(
	state: State,
	update: Record<string, unknown>, // FIXME: This should be Partial<State>
): State {
	if (Object.entries(update).every(([key, value]) => state[key] === value)) {
		return state;
	}

	return Object.assign({}, state, update);
}

export function getDefaultValue(
	state: Pick<FormState<unknown, unknown>, 'initialValue'>,
): URLSearchParams {
	return createSearchParams(state.initialValue);
}

export function isTouched(
	state: Pick<FormState<unknown, unknown>, 'touched'>,
	name: string,
) {
	const result =
		// If field / fieldset is touched
		state.touched.includes(name) ||
		// If child field is touched
		state.touched.some((field) => isPrefix(field, name));

	return result;
}

export function getErrors<ErrorShape>(
	state: Pick<
		FormState<unknown, ErrorShape>,
		'clientError' | 'serverError' | 'touched'
	>,
): Record<string, ErrorShape> {
	return Object.entries(state.serverError ?? state.clientError).reduce<
		Record<string, ErrorShape>
	>((result, [name, value]) => {
		if (isTouched(state, name)) {
			result[name] = value;
		}

		return result;
	}, {});
}

export type Form<Controls extends Record<string, FormControl<any>>> = {
	control: string;
	initialize<Schema, ErrorShape>(context: {
		result?: SubmissionResult<FormIntent<Controls> | null, ErrorShape>;
		defaultValue?: DefaultValue<Schema>;
	}): FormState<Schema, ErrorShape>;
	update<Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape>,
		context: {
			result: SubmissionResult<FormIntent<Controls> | null, ErrorShape>;
			defaultValue?: DefaultValue<Schema>;
		},
	): FormState<Schema, ErrorShape>;
	getSubmission(
		formData: FormData | URLSearchParams,
	): Submission<FormIntent<Controls> | null>;
	report<ErrorShape>(
		submission: Submission<FormIntent<Controls> | null>,
		options?: {
			formErrors?: ErrorShape;
			fieldErrors?: Record<string, ErrorShape>;
		},
	): SubmissionResult<FormIntent<Controls> | null, ErrorShape>;
	serialize(intent: FormIntent<Controls>): string;
	dispatch(
		formElement: HTMLFormElement | null,
		intent: FormIntent<Controls>,
	): void;
};

export type Pretty<T> = { [K in keyof T]: T[K] } & {};

export type FormIntent<Controls extends Record<string, FormControl<any>>> =
	Pretty<
		{
			[Type in keyof Controls]: Controls[Type] extends FormControl<
				infer Payload
			>
				? SubmissionIntent<Payload, Type>
				: never;
		}[Extract<keyof Controls, string>]
	>;

export function defineForm<
	Controls extends Record<string, FormControl<any>>,
>(form: {
	initialize: <Schema, ErrorShape>(context: {
		defaultValue?: DefaultValue<Schema>;
		result?: SubmissionResult<FormIntent<Controls> | null, ErrorShape>;
	}) => FormState<Schema, ErrorShape>;
	onUpdate: <Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape>,
		context: {
			result: SubmissionResult<FormIntent<Controls> | null, ErrorShape>;
			defaultValue?: DefaultValue<Schema>;
		},
	) => FormState<Schema, ErrorShape>;
	onSubmit: <Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape>,
		context: {
			result: SubmissionResult<FormIntent<Controls> | null, ErrorShape>;
			defaultValue?: DefaultValue<Schema>;
		},
	) => FormState<Schema, ErrorShape>;
	controls: Controls;
}): Form<Controls> {
	const controlName = '__control__';

	return {
		control: controlName,
		initialize(context) {
			let state = form.initialize(context);

			if (context.result) {
				if (context.result.intent) {
					const type = context.result.intent.type;
					const control = form.controls?.[type];

					if (typeof control === 'undefined') {
						throw new Error(`The intent type "${type}" is not defined`);
					}

					state = control.onSubmit(state, {
						result: {
							...context.result,
							intent: context.result.intent,
						},
						reset: () =>
							this.initialize({
								...context,
								result: undefined,
							}),
					});
				} else {
					state = form.onSubmit(state, {
						result: context.result,
						defaultValue: context.defaultValue,
					});
				}
			}

			return state;
		},
		update(state, context) {
			const currentState = form.onUpdate(state, context);

			if (context.result.intent) {
				const type = context.result.intent.type;
				const control = form.controls?.[type];

				if (typeof control === 'undefined') {
					throw new Error(`The intent type "${type}" is not defined`);
				}

				return control.onSubmit(currentState, {
					result: {
						...context.result,
						intent: context.result.intent,
					},
					reset: () =>
						this.initialize({
							...context,
							result: undefined,
						}),
				});
			}

			return form.onSubmit(currentState, context);
		},
		report(submission, options) {
			const errors = options
				? Object.assign(
						options.formErrors ? { '': options.formErrors } : {},
						options.fieldErrors,
					)
				: {};

			return {
				type: typeof document !== 'undefined' ? 'client' : 'server',
				submittedValue: submission.submittedValue,
				errors,
				fields: submission.fields.concat(
					Object.keys(errors).filter((key) =>
						submission.fields.every((field) => !isPrefix(field, key)),
					),
				),
				intent: submission.intent,
			};
		},
		getSubmission(formData) {
			const initialValue: Record<string, any> = {};
			const submission: Submission<FormIntent<Controls> | null> = {
				submittedValue: initialValue,
				value: initialValue,
				fields: [],
				intent: null,
			};

			for (const [name, value] of formData.entries()) {
				if (name !== controlName) {
					setValue(submission.submittedValue, name, value, true);
					submission.fields.push(name);
				}
			}

			// Deduplicate fields
			submission.fields = Array.from(new Set(submission.fields));

			const controlValue = formData.get(controlName);

			if (typeof controlValue === 'string') {
				const [type, data] = controlValue.split('/');
				const control = type ? form.controls?.[type] : null;

				if (control) {
					const payload = control.deserialize(data ?? '');
					// @ts-expect-error The intent type should match the control
					submission.intent = {
						type,
						payload,
					};

					if (typeof control.onParse === 'function') {
						submission.value = control.onParse(
							submission.submittedValue,
							payload,
						);
					}
				}
			}

			return submission;
		},
		serialize(intent) {
			const control = form.controls?.[intent.type];
			const payload =
				typeof control?.serialize === 'function'
					? control.serialize(intent.payload)
					: intent.payload ?? '';

			return [intent.type, payload].join('/');
		},
		dispatch(formElement, intent) {
			if (!formElement) {
				throw new Error('Form element not found');
			}

			const submitter = document.createElement('button');

			submitter.name = controlName;
			submitter.value = this.serialize(intent);
			submitter.hidden = true;
			submitter.formNoValidate = true;

			formElement.appendChild(submitter);

			if (typeof formElement.requestSubmit === 'function') {
				formElement.requestSubmit(submitter);
			} else {
				const event = new SubmitEvent('submit', {
					bubbles: true,
					cancelable: true,
					submitter,
				});

				formElement.dispatchEvent(event);
			}

			formElement.removeChild(submitter);
		},
	};
}

export type PartialRequired<T, K extends keyof T> = Pretty<
	Omit<T, K> & Partial<Pick<T, K>>
>;

export type ControlPayload<Type> =
	Type extends FormControl<infer Payload> ? Payload : never;

export function defineControl<Payload>(
	options: PartialRequired<FormControl<Payload>, 'serialize' | 'deserialize'>,
): FormControl<Payload> {
	return {
		serialize: options.serialize ?? JSON.stringify,
		deserialize: options.deserialize ?? JSON.parse,
		...options,
	};
}

/**
 * Configure all form fields based on the current state
 * @param formElement
 * @param state
 */
export function configure(
	formElement: HTMLFormElement | null | undefined,
	state: FormState<unknown, unknown>,
): void {
	if (!formElement) {
		return;
	}

	const getAll = (value: unknown) => {
		if (typeof value === 'string') {
			return [value];
		}

		if (
			Array.isArray(value) &&
			value.every((item) => typeof item === 'string')
		) {
			return value;
		}

		return undefined;
	};
	const get = (value: unknown) => getAll(value)?.[0];

	for (const element of formElement.elements) {
		if (
			element instanceof HTMLInputElement ||
			element instanceof HTMLTextAreaElement ||
			element instanceof HTMLSelectElement
		) {
			const prev = element.dataset.conform;
			const next = getKey(element.name, state);
			const defaultValue = getValue(state.initialValue, element.name);

			if (typeof prev === 'undefined' || prev !== next) {
				element.dataset.conform = next;

				if ('options' in element) {
					const value = getAll(defaultValue) ?? [];

					for (const option of element.options) {
						option.selected = value.includes(option.value);
					}
				} else if (
					(element.type === 'checkbox' || element.type === 'radio') &&
					'checked' in element
				) {
					element.checked = get(defaultValue) === element.value;
				} else {
					element.value = get(defaultValue) ?? '';
				}
			}
		}
	}
}

/**
 * Check if the event target is an input element in the form
 * @param target Event target
 * @param formElement The form element associated with
 */
export function getInput(
	target: unknown,
	formElement: HTMLFormElement | null,
): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
	const isInput =
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement;

	if (!formElement || !isInput || target.form !== formElement) {
		return null;
	}

	return target;
}

export function createSearchParams(data: unknown): URLSearchParams {
	const dictionary = flatten(serialize(data), {
		select(value) {
			if (
				typeof value === 'string' ||
				(Array.isArray(value) &&
					value.every((item) => typeof item === 'string'))
			) {
				return value;
			}

			return;
		},
	});
	const entries = Object.entries(dictionary).flatMap(([name, value]) => {
		if (Array.isArray(value)) {
			return value.map((item) => [name, item]);
		}

		return [[name, value]];
	});

	return new URLSearchParams(entries);
}

export function createDictionary<State>(
	fn: (name: string, proxy: Record<string, State>) => State,
): Record<string, State> {
	const cache: Record<string, State> = {};
	return new Proxy(cache, {
		get(_, name: string | symbol, receiver) {
			if (typeof name !== 'string') {
				return;
			}

			return (cache[name] ??= fn(name, receiver));
		},
	});
}

export function getKey(
	name: string,
	state: Pick<FormState<unknown, unknown>, 'keyByPath'>,
): string | undefined {
	const currentKey = state.keyByPath[name];
	const paths = getPaths(name);

	if (paths.length === 0) {
		return currentKey;
	}

	const parentKey = getKey(formatPaths(paths.slice(0, -1)), state);

	if (typeof parentKey === 'undefined') {
		return currentKey;
	}

	return `${parentKey}/${currentKey ?? paths.at(-1)}`;
}

export function getListKeys(
	name: string,
	state: Pick<FormState<unknown, unknown>, 'keyByPath' | 'initialValue'>,
): Array<string | undefined> {
	const value = getValue(state.initialValue, name);

	if (!Array.isArray(value)) {
		return [];
	}

	return value.map((_, index) => getKey(formatName(name, index), state));
}

export const validateControl = defineControl<{ name?: string }>({
	serialize(payload) {
		return payload.name ?? '';
	},
	deserialize(value) {
		return { name: value };
	},
	onSubmit(state, { result }) {
		const name = result.intent.payload.name ?? '';

		state.touched;

		if (name === '') {
			return merge(state, {
				touched: deepEqual(state.touched, result.fields)
					? state.touched
					: result.fields,
			});
		}

		if (state.touched.includes(name)) {
			return state;
		}

		return {
			...state,
			touched: state.touched.concat(name),
		};
	},
});

export const updateControl = defineControl<{
	name: string;
	index?: number;
	value?: any;
}>({
	onParse(value, payload) {
		return modifyNestedData(
			value,
			payload.value,
			formatName(payload.name, payload.index),
		);
	},
	onSubmit(state, { result }) {
		const payload = result.intent.payload;
		const name = formatName(payload.name, payload.index);

		return merge(state, {
			keyByPath: createKey(payload.value, name, state.keyByPath),
			initialValue: modifyNestedData(state.initialValue, payload.value, name),
		});
	},
});

export const resetControl = defineControl<undefined>({
	serialize() {
		return '';
	},
	deserialize() {
		return;
	},
	onParse() {
		return null;
	},
	onSubmit(_, { reset }) {
		return reset();
	},
});

export function mapKeys<Value>(
	obj: Record<string, Value>,
	fn: (key: string) => string | null,
) {
	const result: Record<string, Value> = {};

	for (const [key, value] of Object.entries(obj)) {
		const name = fn(key);

		if (name !== null) {
			result[name] = value;
		}
	}

	return result;
}

export function addItems<Item>(list: Array<Item>, items: Array<Item>) {
	const updated = items.reduce((result, item) => {
		if (result.includes(item)) {
			return result;
		}

		return result.concat(item);
	}, list);

	if (deepEqual(list, updated)) {
		return list;
	}

	return updated;
}

export function mapItems<Item>(
	list: Array<NonNullable<Item>>,
	fn: (value: Item) => Item | null,
): Array<Item> {
	const updated = list.reduce<Array<Item>>((result, item) => {
		const value = fn(item);

		if (value !== null) {
			result.push(value);
		}

		return result;
	}, []);

	if (deepEqual(list, updated)) {
		return list;
	}

	return updated;
}

export function updateListIndex(
	listPaths: Array<string | number>,
	name: string,
	adjustIndex: (index: number) => number | null,
): string | null {
	const paths = getPaths(name);

	if (
		paths.length > listPaths.length &&
		listPaths.every((path, index) => paths[index] === path)
	) {
		const currentIndex = paths[listPaths.length];

		if (typeof currentIndex === 'number') {
			const newIndex = adjustIndex(currentIndex);

			if (newIndex === null) {
				return null;
			}

			if (newIndex !== currentIndex) {
				// Replace the index
				paths.splice(listPaths.length, 1, newIndex);

				return formatPaths(paths);
			}
		}
	}

	return name;
}

export const insertControl = defineControl<{
	name: string;
	index?: number;
	defaultValue?: any;
}>({
	onParse(value, payload) {
		const data = getValue(value, payload.name) ?? [];

		if (!Array.isArray(data)) {
			throw new Error(
				`Failed to insert value; The data at "${payload.name}" is not an array`,
			);
		}

		const index = payload.index ?? data.length;
		const list = Array.from(data);

		list.splice(index, 0, payload.defaultValue);

		return modifyNestedData(value, list, payload.name);
	},
	onSubmit(state, { result }) {
		const payload = result.intent.payload;
		const value = getValue(state.initialValue, payload.name) ?? [];

		if (!Array.isArray(value)) {
			throw new Error(
				`Failed to insert value; The initialValue at "${payload.name}" is not an array`,
			);
		}

		const index = payload.index ?? value.length;
		const list = Array.from(value);
		const listPaths = getPaths(payload.name);
		const adjustIndex = (currentIndex: number) =>
			index <= currentIndex ? currentIndex + 1 : currentIndex;

		list.splice(payload.index ?? list.length, 0, payload.defaultValue);

		return merge(state, {
			keyByPath: createKey(
				payload.defaultValue,
				formatName(payload.name, index),
				mapKeys(state.keyByPath, (key) =>
					updateListIndex(listPaths, key, adjustIndex),
				),
			),
			touched: addItems(
				mapItems(state.touched, (key) =>
					updateListIndex(listPaths, key, adjustIndex),
				),
				[payload.name],
			),
			initialValue: modifyNestedData(state.initialValue, list, payload.name),
		});
	},
});

export const removeControl = defineControl<{ name: string; index: number }>({
	onParse(value, payload) {
		const data = getValue(value, payload.name) ?? [];

		if (!Array.isArray(data)) {
			throw new Error(
				`Failed to remove item; The value at "${payload.name}" is not an array`,
			);
		}

		const list = Array.from(data);

		list.splice(payload.index, 1);

		return modifyNestedData(value, list, payload.name);
	},
	onSubmit(state, { result }) {
		const payload = result.intent.payload;
		const value = getValue(state.initialValue, payload.name) ?? [];

		if (!Array.isArray(value)) {
			throw new Error(
				`Failed to remove item; The initialValue at "${payload.name}" is not an array`,
			);
		}

		const list = Array.from(value);
		const listPaths = getPaths(payload.name);
		const adjustIndex = (currentIndex: number) => {
			if (payload.index === currentIndex) {
				return null;
			}

			return payload.index < currentIndex ? currentIndex - 1 : currentIndex;
		};

		list.splice(payload.index, 1);

		return merge(state, {
			keyByPath: mapKeys(state.keyByPath, (key) =>
				updateListIndex(listPaths, key, adjustIndex),
			),
			touched: addItems(
				mapItems(state.touched, (key) =>
					updateListIndex(listPaths, key, adjustIndex),
				),
				[payload.name],
			),
			initialValue: modifyNestedData(state.initialValue, list, payload.name),
		});
	},
});

export const reorderControl = defineControl<{
	name: string;
	from: number;
	to: number;
}>({
	onParse(value, payload) {
		const data = getValue(value, payload.name) ?? [];

		if (!Array.isArray(data)) {
			throw new Error(
				`Failed to reorder items; The value at "${payload.name}" is not an array`,
			);
		}

		const list = Array.from(data);

		list.splice(payload.to, 0, ...list.splice(payload.from, 1));

		return modifyNestedData(value, list, payload.name);
	},
	onSubmit(state, { result }) {
		const payload = result.intent.payload;
		const value = getValue(state.initialValue, payload.name) ?? [];

		if (!Array.isArray(value)) {
			throw new Error(
				`Failed to insert value; The initialValue at "${payload.name}" is not an array`,
			);
		}

		const list = Array.from(value);
		const listPaths = getPaths(payload.name);
		const adjustIndex = (currentIndex: number) => {
			if (payload.from === payload.to) {
				return currentIndex;
			}

			if (currentIndex === payload.from) {
				return payload.to;
			}

			if (payload.from < payload.to) {
				return currentIndex > payload.from && currentIndex <= payload.to
					? currentIndex - 1
					: currentIndex;
			}

			return currentIndex >= payload.to && currentIndex < payload.from
				? currentIndex + 1
				: currentIndex;
		};

		list.splice(payload.to, 0, ...list.splice(payload.from, 1));

		return merge(state, {
			keyByPath: mapKeys(state.keyByPath, (key) =>
				updateListIndex(listPaths, key, adjustIndex),
			),
			touched: addItems(
				mapItems(state.touched, (item) =>
					updateListIndex(listPaths, item, adjustIndex),
				),
				[payload.name],
			),
			initialValue: modifyNestedData(state.initialValue, list, payload.name),
		});
	},
});

export const controls = {
	validate: validateControl,
	update: updateControl,
	reset: resetControl,
	insert: insertControl,
	remove: removeControl,
	reorder: reorderControl,
};

export const form = defineForm({
	// @ts-expect-error The DefaultValue type is buggy
	initialize({ defaultValue, result }) {
		return {
			keyByPath: createKey(defaultValue),
			defaultValue: defaultValue ?? null,
			initialValue: result?.submittedValue ?? defaultValue ?? {},
			submittedValue: result?.submittedValue ?? null,
			serverError:
				result?.type === 'server' && result.errors ? result.errors : null,
			clientError:
				result?.type === 'client' && result.errors ? result.errors : {},
			touched: [],
		};
	},
	onUpdate(state, { result }) {
		return merge(state, {
			clientError:
				result.type === 'client' && !deepEqual(state.clientError, result.errors)
					? result.errors
					: state.clientError,
			serverError:
				result.type === 'server' && !deepEqual(state.serverError, result.errors)
					? result.errors
					: result.type === 'client' &&
						  !deepEqual(state.submittedValue, result.submittedValue)
						? null
						: state.serverError,
			submittedValue:
				result.type === 'server' ? result.submittedValue : state.submittedValue,
		});
	},
	onSubmit(state, { result }) {
		return Object.assign({}, state, {
			touched: deepEqual(state.touched, result.fields)
				? state.touched
				: result.fields,
		});
	},
	controls,
});
