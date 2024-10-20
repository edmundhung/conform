export type Submission<Intent> = {
	fields: string[];
	value: Record<string, FormValue> | null;
	intent: Intent | null;
};

export type FormValue<Entry extends FormDataEntryValue = FormDataEntryValue> =
	| Entry
	| FormValue<Entry>[]
	| { [key: string]: FormValue<Entry> };

export type FormError<ErrorShape> = {
	formError: ErrorShape | null;
	fieldError: Record<string, ErrorShape>;
};

export type SubmissionResult<
	Intent,
	ErrorShape,
	FormValueType extends FormDataEntryValue = FormDataEntryValue,
> = {
	type: 'client' | 'server';
	fields: string[];
	value: Record<string, FormValue<FormValueType>> | null;
	error: FormError<ErrorShape>;
	intent: Intent;
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

export type FormState<Schema, ErrorShape> = {
	defaultValue: DefaultValue<Schema> | null;
	serverError: FormError<ErrorShape> | null;
	clientError: FormError<ErrorShape> | null;
	keyByPath: Record<string, string>;
	initialValue: Record<string, FormValue>;
	submittedValue: Record<string, FormValue> | null;
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

export type SerialziedValue<Schema> = Schema extends null
	? undefined
	: Schema extends number | bigint
		? string
		: Schema extends boolean
			? string | undefined
			: Schema extends Date
				? string
				: Schema extends Array<infer Item>
					? Array<SerialziedValue<Item>>
					: Schema extends Record<string, any>
						? { [key in keyof Schema]: SerialziedValue<Schema[key]> }
						: Schema;

export function serialize<Schema>(value: Schema): SerialziedValue<Schema> {
	if (isPlainObject(value)) {
		// @ts-expect-error Please submit a PR if you know how to fix this
		return Object.entries(value).reduce<Record<string, unknown>>(
			(result, [key, value]) => {
				result[key] = serialize(value);
				return result;
			},
			{},
		);
	} else if (Array.isArray(value)) {
		// @ts-expect-error Please submit a PR if you know how to fix this
		return value.map(serialize);
	} else if (value instanceof Date) {
		// @ts-expect-error Please submit a PR if you know how to fix this
		return value.toISOString();
	} else if (typeof value === 'boolean') {
		// @ts-expect-error Please submit a PR if you know how to fix this
		return value ? 'on' : undefined;
	} else if (typeof value === 'number' || typeof value === 'bigint') {
		// @ts-expect-error Please submit a PR if you know how to fix this
		return value.toString();
	} else {
		// @ts-expect-error Please submit a PR if you know how to fix this
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

export function report<Intent, ErrorShape>(
	submission: Submission<Intent | null>,
	options: {
		formError?: ErrorShape;
		fieldError?: Record<string, ErrorShape>;
		keepFile: true;
	},
): SubmissionResult<Intent | null, ErrorShape, FormDataEntryValue>;
export function report<Intent, ErrorShape>(
	submission: Submission<Intent | null>,
	options?: {
		formError?: ErrorShape;
		fieldError?: Record<string, ErrorShape>;
		keepFile?: false;
	},
): SubmissionResult<Intent | null, ErrorShape, string>;
export function report<Intent, ErrorShape>(
	submission: Submission<Intent | null>,
	options?: {
		formError?: ErrorShape;
		fieldError?: Record<string, ErrorShape>;
		includeFiles?: boolean;
	},
): SubmissionResult<Intent | null, ErrorShape> {
	return {
		type: typeof document !== 'undefined' ? 'client' : 'server',
		value: !options?.includeFiles
			? // TODO: remove all files from submission.value
				submission.value
			: submission.value,
		error: {
			formError: options?.formError ?? null,
			fieldError: options?.fieldError ?? {},
		},
		fields: submission.fields.concat(
			Object.keys(options?.fieldError ?? {}).filter((key) =>
				submission.fields.every((field) => !isPrefix(field, key)),
			),
		),
		intent: submission.intent,
	};
}

export function resolve(
	formData: FormData | URLSearchParams,
	options?: {
		intentName: string;
		updateValue?(
			submittedValue: Record<string, any>,
			intent: string,
		): Record<string, any> | null;
	},
): Submission<string | null>;
export function resolve<Intent = string>(
	formData: FormData | URLSearchParams,
	options?: {
		intentName: string;
		parseIntent(intentValue: string): Intent | null;
		updateValue?(
			submittedValue: Record<string, any>,
			intent: Intent,
		): Record<string, any> | null;
	},
): Submission<Intent | null>;
export function resolve<Intent = string>(
	formData: FormData | URLSearchParams,
	options?: {
		intentName: string;
		parseIntent?(intentValue: string): Intent | null;
		updateValue?(
			submittedValue: Record<string, any>,
			intent: Intent | string,
		): Record<string, any> | null;
	},
): Submission<Intent | string | null> {
	const initialValue: Record<string, any> = {};
	const submission: Submission<Intent | string | null> = {
		value: initialValue,
		fields: [],
		intent: null,
	};

	for (const [name, value] of formData.entries()) {
		if (name !== options?.intentName) {
			setValue(initialValue, name, value, true);
			submission.fields.push(name);
		}
	}

	// Deduplicate fields
	submission.fields = Array.from(new Set(submission.fields));

	if (options) {
		const intentValue = formData.get(options.intentName);

		if (typeof intentValue === 'string') {
			const intent = options.parseIntent?.(intentValue) ?? intentValue;

			if (intent) {
				submission.intent = intent;
				submission.value =
					options.updateValue?.(initialValue, intent) ?? initialValue;
			}
		}
	}

	return submission;
}

export function handleFormSubmit<Schema, ErrorShape, Intent>(
	state: FormState<Schema, ErrorShape>,
	result: SubmissionResult<Intent | null, ErrorShape>,
): FormState<Schema, ErrorShape> {
	return Object.assign({}, state, {
		touched: deepEqual(state.touched, result.fields)
			? state.touched
			: result.fields,
	});
}

export function initializeFormState<Schema, ErrorShape, Intent>({
	defaultValue,
	result,
	controls,
}: {
	defaultValue?: DefaultValue<Schema>;
	result?: SubmissionResult<Intent | null, ErrorShape>;
	controls?: FormControls<Intent>;
}): FormState<Schema, ErrorShape> {
	let state: FormState<Schema, ErrorShape> = {
		keyByPath: createKey(defaultValue),
		defaultValue: defaultValue ?? null,
		initialValue: result?.value ?? defaultValue ?? {},
		submittedValue: result?.value ?? null,
		serverError:
			result?.type === 'server' && result.error ? result.error : null,
		clientError:
			result?.type === 'client' && result.error ? result.error : null,
		touched: [],
	};

	if (result) {
		if (result.intent && controls) {
			state = controls.onSubmit(
				state,
				{
					...result,
					intent: result.intent,
				},
				{
					reset: () => initializeFormState({ defaultValue, controls }),
				},
			);
		} else {
			state = handleFormSubmit(state, result);
		}
	}

	return state;
}

export function updateFormState<Schema, ErrorShape, Intent>(
	state: FormState<Schema, ErrorShape>,
	{
		result,
		defaultValue,
		controls,
	}: {
		result: SubmissionResult<Intent | null, ErrorShape>;
		defaultValue?: DefaultValue<Schema>;
		controls?: FormControls<Intent>;
	},
) {
	const currentState = merge(state, {
		clientError:
			result.type === 'client' && !deepEqual(state.clientError, result.error)
				? result.error
				: state.clientError,
		serverError:
			result.type === 'server' && !deepEqual(state.serverError, result.error)
				? result.error
				: result.type === 'client' &&
					  !deepEqual(state.submittedValue, result.value)
					? null
					: state.serverError,
		submittedValue:
			result.type === 'server' ? result.value : state.submittedValue,
	});

	if (result.intent && controls) {
		return controls.onSubmit(
			currentState,
			{
				...result,
				intent: result.intent,
			},
			{
				reset: () => initializeFormState({ defaultValue, controls }),
			},
		);
	}

	return handleFormSubmit(currentState, result);
}

export type PartialRequired<T, K extends keyof T> = Pretty<
	Omit<T, K> & Partial<Pick<T, K>>
>;

export type ControlPayload<Type> =
	Type extends FormControl<infer Payload> ? Payload : never;

export type FormControls<Intent> = {
	intentName: string;
	parseIntent(intent: string): Intent | null;
	updateValue(
		submittedValue: Record<string, any>,
		intent: Intent,
	): Record<string, any> | null;
	serialize(intent: Intent): string;
	dispatch(formElement: HTMLFormElement | null, intent: Intent): void;
	onSubmit<Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape>,
		result: SubmissionResult<Intent, ErrorShape>,
		context: {
			reset(): FormState<Schema, ErrorShape>;
		},
	): FormState<Schema, ErrorShape>;
};

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

export const controls = createFormControls({
	validate: validateControl,
	update: updateControl,
	reset: resetControl,
	insert: insertControl,
	remove: removeControl,
	reorder: reorderControl,
});

export function createFormControls<
	Controls extends Record<string, FormControl<any>>,
>(
	controls: Controls,
	options?: {
		intentName?: string;
	},
): FormControls<FormIntent<Controls>> {
	const intentName = options?.intentName ?? '__intent__';

	return {
		intentName,
		// @ts-expect-error Not sure how to match the types
		parseIntent(intent) {
			const [type, data] = intent.split('/');
			const control = type ? controls[type] : null;

			if (!control) {
				return null;
			}

			return {
				type,
				payload: control.deserialize(data ?? ''),
			};
		},
		serialize(intent) {
			const control = controls[intent.type];
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

			submitter.name = intentName;
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
		updateValue(submittedValue, intent) {
			const type = intent.type;
			const control = controls[type];

			if (typeof control === 'undefined') {
				throw new Error(`The intent type "${type}" is not defined`);
			}

			return (
				control.onParse?.(submittedValue, intent.payload) ?? submittedValue
			);
		},
		onSubmit(state, result, context) {
			const type = result.intent.type;
			const control = controls[type];

			if (typeof control === 'undefined') {
				throw new Error(`The intent type "${type}" is not defined`);
			}

			return control.onSubmit(state, {
				result,
				reset: context.reset,
			});
		},
	};
}

const error = Symbol('error');
const field = Symbol('field');
const form = Symbol('form');

export type FormId<
	Schema extends Record<string, unknown> = Record<string, unknown>,
	Error = string[],
> = string & {
	[error]?: Error;
	[form]?: Schema;
};

export type FieldName<
	FieldSchema,
	FormSchema extends Record<string, unknown> = Record<string, unknown>,
	Error = string[],
> = string & {
	[field]?: FieldSchema;
	[error]?: Error;
	[form]?: FormSchema;
};

export type FieldConstraint = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: string | number;
	max?: string | number;
	step?: string | number;
	multiple?: boolean;
	pattern?: string;
};

type BaseCombine<
	T,
	K extends PropertyKey = T extends unknown ? keyof T : never,
> = T extends unknown ? T & Partial<Record<Exclude<K, keyof T>, never>> : never;

export type Combine<T> = {
	[K in keyof BaseCombine<T>]: BaseCombine<T>[K];
};

export type FieldMetadata<
	Schema,
	FormSchema extends Record<string, unknown>,
	ErrorShape = string[],
> = Pretty<
	{
		// id: string;
		// errorId: string;
		// descriptionId: string;
		key: string | undefined;
		name: FieldName<Schema, FormSchema, ErrorShape>;
		defaultValue: string | string[] | undefined;
		touched: boolean;
		error: ErrorShape | undefined;
	} & FieldConstraint &
		([Schema] extends [Date | File]
			? {}
			: [Schema] extends [Array<infer Item> | null | undefined]
				? {
						getFieldList: () => Array<
							FieldMetadata<Item, FormSchema, ErrorShape>
						>;
					}
				: [Schema] extends [Record<string, unknown> | null | undefined]
					? {
							getFieldset: () => FieldsetMetadata<
								Schema,
								FormSchema,
								ErrorShape
							>;
						}
					: {})
>;

export type FieldsetMetadata<
	Schema,
	FormSchema extends Record<string, unknown>,
	ErrorShape = string[],
> = Required<{
	[Key in keyof Combine<Schema>]: FieldMetadata<
		Combine<Schema>[Key],
		FormSchema,
		ErrorShape
	>;
}>;

export type FormMetadata<
	Schema extends Record<string, unknown> = Record<string, unknown>,
	ErrorShape = string[],
> = Pretty<
	FieldMetadata<Schema, Schema, ErrorShape> & {
		status: 'success' | 'error' | undefined;
		fieldError: Record<string, ErrorShape> | null;
	}
>;

export function getFormMetadata<
	Schema extends Record<string, unknown>,
	ErrorShape,
>(state: FormState<Schema, ErrorShape>): FormMetadata<Schema, ErrorShape> {
	const error = state.serverError ?? state.clientError;

	function createMetadata(name = '') {
		return {
			name,
			get key() {
				return getKey(name, state);
			},
			get defaultValue() {
				const serializedValue = serialize(state.initialValue);
				const value = getValue(serializedValue, name);

				if (
					typeof value !== 'string' &&
					(!Array.isArray(value) ||
						value.some((item) => typeof item !== 'string'))
				) {
					return;
				}

				return value;
			},
			get touched() {
				return isTouched(state, name);
			},
			get error() {
				const result = name ? error?.fieldError[name] : error?.formError;

				if (!result || !isTouched(state, name)) {
					return;
				}

				return result;
			},
			get getFieldset() {
				return () =>
					new Proxy({} as any, {
						get(target, key, receiver) {
							if (typeof key === 'string') {
								const fieldName = formatName(name, key);

								return Object.assign(createMetadata(fieldName), {
									get getFieldList() {
										return () => {
											const value =
												getValue(state.initialValue, fieldName) ?? [];

											if (!Array.isArray(value)) {
												throw new Error(
													`Failed to get the field list; The value at "${fieldName}" is not an array`,
												);
											}

											return Array(value.length)
												.fill(0)
												.map((_, index) =>
													createMetadata(formatName(fieldName, index)),
												);
										};
									},
								});
							}

							return Reflect.get(target, key, receiver);
						},
					});
			},
		};
	}

	// @ts-expect-error FIXME
	return Object.assign(createMetadata(), {
		status: undefined,
		fieldError: error?.fieldError ?? null,
	});
}
