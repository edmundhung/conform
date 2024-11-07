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
	error: FormError<ErrorShape> | null;
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
	versionByBranch: Record<string, string>;
	initialValue: Record<string, FormValue>;
	submittedValue: Record<string, FormValue> | null;
	touchedFields: string[];
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

export function generateVersion(): string {
	return Math.floor(Date.now() * Math.random()).toString(36);
}

/**
 * Flatten a tree into a dictionary
 */
export function flatten<Value>(
	data: unknown,
	select: (value: unknown) => Value,
	prefix?: string,
): Record<string, NonNullable<Value>> {
	const result: Record<string, NonNullable<Value>> = {};

	function process(data: unknown, prefix: string) {
		const value = select(data);

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
		process(data, prefix ?? '');
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
			if (typeof segment !== 'undefined' && segment !== '') {
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

export function updateVersionByBranch(
	currentVersionByBranch: Record<string, string>,
	defaultValue: unknown,
	prefix: string = '',
): Record<string, string> {
	const arrayByName = flatten(
		defaultValue,
		(value) => (Array.isArray(value) ? value : null),
		prefix,
	);
	const result = Object.entries(arrayByName).reduce<Record<string, string>>(
		(result, [name, array]) => {
			const paths = getPaths(name);

			for (let i = 0; i < array.length; i++) {
				result[formatPaths(paths.concat(i))] = generateVersion();
			}

			return result;
		},
		prefix
			? mapKeys(currentVersionByBranch, (key) =>
					!isPrefix(key, prefix) ? key : null,
				)
			: currentVersionByBranch,
	);

	result[prefix] = generateVersion();

	return result;
}

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
 * As identity function that returns the input value
 */
function identiy<Value>(value: Value): Value {
	return value;
}

/**
 * Create a shallow clone of the value
 * This allows us to create a new object without mutating the original object
 */
function shallowClone<Value>(value: Value): Value {
	if (Array.isArray(value)) {
		return value.slice() as Value;
	} else if (isPlainObject(value)) {
		return { ...value } as Value;
	}

	if (value && typeof value === 'object') {
		throw new Error(`${value} is not supported`);
	}

	return value;
}

/**
 * Retrive the value from a target object by following the paths
 */
export function getValue(
	target: unknown,
	paths: Array<string | number>,
): unknown {
	let pointer = target;

	for (const path of paths) {
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

export function setValue<Data extends Record<string, any>>(
	data: Data,
	paths: Array<string | number>,
	value: unknown | ((currentValue: unknown) => unknown),
	handle: <Value>(value: Value) => Value = identiy,
): Data {
	if (paths.length === 0) {
		throw new Error('Setting value to the object root is not supported');
	}

	// Clone the paths to prevent mutation
	const remainingPaths = paths.slice();
	const result = handle(data);

	let target: any = result;

	while (remainingPaths.length > 0) {
		const path = remainingPaths.shift();
		const nextPath = remainingPaths[0];

		if (typeof path === 'undefined' || path in Object.prototype) {
			break;
		}

		const nextValue = getValue(target, [path]);

		if (typeof nextPath === 'undefined') {
			target[path] = typeof value === 'function' ? value(nextValue) : value;
		} else {
			target[path] = handle(
				nextValue ?? (typeof nextPath === 'number' ? [] : {}),
			);
		}

		target = target[path];
	}

	return result;
}

export function modify<Data extends Record<string, any>>(
	data: Data,
	name: string,
	value: unknown,
): Data {
	const paths = getPaths(name);
	const currentData = getValue(data, paths);

	if (deepEqual(currentData, value)) {
		return data;
	}

	return setValue(data, paths, value, shallowClone);
}

/**
 * Create a copy of the object with the updated fields if there is any change
 */
export function merge<State extends Record<string, any>>(
	state: State,
	update: Partial<State>,
): State {
	if (Object.entries(update).every(([key, value]) => state[key] === value)) {
		return state;
	}

	return Object.assign({}, state, update);
}

/**
 * Determine if the field is touched
 *
 * This checks if the field is in the list of touched fields,
 * or if there is any child field that is touched, i.e. form / fieldset
 */
export function isTouched(touchedFields: string[], name = '') {
	if (touchedFields.includes(name)) {
		return true;
	}

	return touchedFields.some((field) => isPrefix(field, name));
}

export type Pretty<T> = { [K in keyof T]: T[K] } & {};

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
		error:
			options?.formError || options?.fieldError
				? {
						formError: options?.formError ?? null,
						fieldError: options?.fieldError ?? {},
					}
				: null,
		fields: submission.fields.concat(
			// Sometimes we couldn't find out all the fields from the submission, e.g. unchecked checkboxes
			// But the schema might have an error on those fields, so we need to include them
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
		parseIntent?: undefined;
		updateValue?(
			submittedValue: Record<string, FormValue>,
			intent: string,
		): Record<string, FormValue> | null;
	},
): Submission<string | null>;
export function resolve<Intent>(
	formData: FormData | URLSearchParams,
	options: {
		intentName: string;
		parseIntent(intentValue: string): Intent | null;
		updateValue?(
			submittedValue: Record<string, FormValue>,
			intent: Intent,
		): Record<string, FormValue> | null;
	},
): Submission<Intent | null>;
export function resolve<Intent>(
	formData: FormData | URLSearchParams,
	options?: {
		intentName: string;
		parseIntent?(intentValue: string): Intent | string | null;
		updateValue?(
			submittedValue: Record<string, FormValue>,
			intent: Intent | string,
		): Record<string, FormValue> | null;
	},
): Submission<Intent | string | null> {
	const initialValue: Record<string, any> = {};
	const fields = new Set<string>();

	for (const [name, value] of formData.entries()) {
		if (name !== options?.intentName) {
			setValue(initialValue, getPaths(name), (currentValue: unknown) => {
				if (typeof currentValue === 'undefined') {
					return value;
				} else if (Array.isArray(currentValue)) {
					return currentValue.concat(value);
				} else {
					return [currentValue, value];
				}
			});
			fields.add(name);
		}
	}

	const submission: Submission<Intent | string | null> = {
		value: initialValue,
		fields: Array.from(fields),
		intent: null,
	};

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
	return merge(state, {
		touchedFields: deepEqual(state.touchedFields, result.fields)
			? state.touchedFields
			: result.fields,
	});
}

export function initializeFormState<
	Schema,
	ErrorShape,
	Intent extends BaseIntent,
>({
	defaultValue,
	result,
	control,
}: {
	defaultValue?: DefaultValue<Schema>;
	result?: SubmissionResult<Intent | null, ErrorShape>;
	control?: FormControl<Intent>;
}): FormState<Schema, ErrorShape> {
	let state: FormState<Schema, ErrorShape> = {
		versionByBranch: updateVersionByBranch({}, defaultValue),
		defaultValue: defaultValue ?? null,
		initialValue: result?.value ?? defaultValue ?? {},
		submittedValue: result?.value ?? null,
		serverError:
			result?.type === 'server' && result.error ? result.error : null,
		clientError:
			result?.type === 'client' && result.error ? result.error : null,
		touchedFields: [],
	};

	if (result) {
		if (result.intent && control) {
			state = control.onSubmit(state, {
				result: Object.assign({}, result, { intent: result.intent }),
				reset: () => initializeFormState({ defaultValue, control }),
			});
		} else {
			state = handleFormSubmit(state, result);
		}
	}

	return state;
}

export function updateFormState<Schema, ErrorShape, Intent extends BaseIntent>(
	state: FormState<Schema, ErrorShape>,
	{
		result,
		defaultValue,
		control,
	}: {
		result: SubmissionResult<Intent | null, ErrorShape>;
		defaultValue?: DefaultValue<Schema>;
		control?: FormControl<Intent>;
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

	if (result.intent && control) {
		return control.onSubmit(currentState, {
			result: Object.assign({}, result, { intent: result.intent }),
			reset: () => initializeFormState({ defaultValue, control }),
		});
	}

	return handleFormSubmit(currentState, result);
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
			const next = generateKey(state.versionByBranch, element.name);
			const paths = getPaths(element.name);
			const defaultValue = getValue(state.initialValue, paths);

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

export function generateKey(
	versionByBranch: Record<string, string>,
	name: string,
): string | undefined {
	const paths = getPaths(name);
	let key = versionByBranch[name];

	if (paths.length > 0) {
		const parentKey = generateKey(
			versionByBranch,
			formatPaths(paths.slice(0, -1)),
		);

		key = `${parentKey}/${key ?? paths.at(-1)}`;
	}

	return key;
}

export const validateControl = createFormControl(
	(intent) => {
		if (
			intent.type !== 'validate' ||
			!isPlainObject(intent.payload) ||
			(typeof intent.payload.name !== 'string' &&
				typeof intent.payload.name !== 'undefined')
		) {
			return null;
		}

		return {
			type: 'validate',
			payload: {
				name: intent.payload.name,
			},
		} as const;
	},
	{
		onSubmit(state, { result }) {
			const name = result.intent.payload.name ?? '';

			if (name === '') {
				return merge(state, {
					touchedFields: deepEqual(state.touchedFields, result.fields)
						? state.touchedFields
						: result.fields,
				});
			}

			if (state.touchedFields.includes(name)) {
				return state;
			}

			return {
				...state,
				touchedFields: state.touchedFields.concat(name),
			};
		},
	},
);

export const updateControl = createFormControl(
	(intent) => {
		if (
			intent.type !== 'update' ||
			!isPlainObject(intent.payload) ||
			typeof intent.payload.name !== 'string' ||
			(typeof intent.payload.index !== 'undefined' &&
				typeof intent.payload.index !== 'number')
		) {
			return null;
		}

		return {
			type: intent.type,
			payload: {
				name: intent.payload.name,
				index: intent.payload.index,
				value: intent.payload.value,
			},
		} as const;
	},
	{
		updateValue(value, intent) {
			return modify(
				value,
				formatName(intent.payload.name, intent.payload.index),
				intent.payload.value,
			);
		},
		onSubmit(state, { result }) {
			const payload = result.intent.payload;
			const name = formatName(payload.name, payload.index);

			return merge(state, {
				versionByBranch: updateVersionByBranch(
					state.versionByBranch,
					payload.value,
					name,
				),
				initialValue: modify(state.initialValue, name, payload.value),
			});
		},
	},
);

export const resetControl = createFormControl(
	(intent) => {
		if (intent.type !== 'reset' || intent.payload !== undefined) {
			return null;
		}

		return {
			type: intent.type,
		} as const;
	},
	{
		updateValue() {
			return null;
		},
		onSubmit(_, { reset }) {
			return reset();
		},
	},
);

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

export const listControl = createFormControl(
	(intent) => {
		if (
			isPlainObject(intent.payload) &&
			typeof intent.payload.name === 'string'
		) {
			switch (intent.type) {
				case 'insert': {
					if (
						typeof intent.payload.index === 'undefined' ||
						typeof intent.payload.index === 'number'
					) {
						return {
							type: intent.type,
							payload: {
								name: intent.payload.name,
								index: intent.payload.index,
								defaultValue: intent.payload.defaultValue,
							},
						};
					}
					break;
				}
				case 'remove': {
					if (typeof intent.payload.index === 'number') {
						return {
							type: intent.type,
							payload: {
								name: intent.payload.name,
								index: intent.payload.index,
							},
						};
					}
					break;
				}
				case 'reorder': {
					if (
						typeof intent.payload.from === 'number' &&
						typeof intent.payload.to === 'number'
					) {
						return {
							type: intent.type,
							payload: {
								name: intent.payload.name,
								from: intent.payload.from,
								to: intent.payload.to,
							},
						};
					}
					break;
				}
			}
		}

		return null;
	},
	{
		updateValue(value, intent) {
			const paths = getPaths(intent.payload.name);
			const data = getValue(value, paths) ?? [];

			if (!Array.isArray(data)) {
				throw new Error(
					`Update list value failed; The value at "${intent.payload.name}" is not an array`,
				);
			}

			// Clone the array to before mutating
			const list = Array.from(data);

			switch (intent.type) {
				case 'insert': {
					list.splice(
						intent.payload.index ?? list.length,
						0,
						intent.payload.defaultValue,
					);
					break;
				}
				case 'remove': {
					list.splice(intent.payload.index, 1);
					break;
				}
				case 'reorder': {
					list.splice(
						intent.payload.to,
						0,
						...list.splice(intent.payload.from, 1),
					);
					break;
				}
			}

			return modify(value, intent.payload.name, list);
		},
		onSubmit(state, { result }) {
			const intent = result.intent;
			const paths = getPaths(intent.payload.name);
			const data = getValue(state.initialValue, paths) ?? [];

			if (!Array.isArray(data)) {
				throw new Error(
					`Update state failed; The initialValue at "$intent.payload.name}" is not an array`,
				);
			}

			const list = Array.from(data);
			const listPaths = getPaths(intent.payload.name);

			switch (intent.type) {
				case 'insert': {
					const index = intent.payload.index ?? list.length;
					const adjustIndex = (currentIndex: number) =>
						index <= currentIndex ? currentIndex + 1 : currentIndex;

					list.splice(
						intent.payload.index ?? list.length,
						0,
						intent.payload.defaultValue,
					);

					return merge(state, {
						versionByBranch: updateVersionByBranch(
							mapKeys(state.versionByBranch, (key) =>
								updateListIndex(listPaths, key, adjustIndex),
							),
							intent.payload.defaultValue,
							formatName(intent.payload.name, index),
						),
						touchedFields: addItems(
							mapItems(state.touchedFields, (key) =>
								updateListIndex(listPaths, key, adjustIndex),
							),
							[intent.payload.name],
						),
						initialValue: modify(state.initialValue, intent.payload.name, list),
					});
				}
				case 'remove': {
					const adjustIndex = (currentIndex: number) => {
						if (intent.payload.index === currentIndex) {
							return null;
						}

						return intent.payload.index < currentIndex
							? currentIndex - 1
							: currentIndex;
					};

					list.splice(intent.payload.index, 1);

					return merge(state, {
						versionByBranch: mapKeys(state.versionByBranch, (key) =>
							updateListIndex(listPaths, key, adjustIndex),
						),
						touchedFields: addItems(
							mapItems(state.touchedFields, (key) =>
								updateListIndex(listPaths, key, adjustIndex),
							),
							[intent.payload.name],
						),
						initialValue: modify(state.initialValue, intent.payload.name, list),
					});
				}
				case 'reorder': {
					const adjustIndex = (currentIndex: number) => {
						if (intent.payload.from === intent.payload.to) {
							return currentIndex;
						}

						if (currentIndex === intent.payload.from) {
							return intent.payload.to;
						}

						if (intent.payload.from < intent.payload.to) {
							return currentIndex > intent.payload.from &&
								currentIndex <= intent.payload.to
								? currentIndex - 1
								: currentIndex;
						}

						return currentIndex >= intent.payload.to &&
							currentIndex < intent.payload.from
							? currentIndex + 1
							: currentIndex;
					};

					list.splice(
						intent.payload.to,
						0,
						...list.splice(intent.payload.from, 1),
					);

					return merge(state, {
						versionByBranch: mapKeys(state.versionByBranch, (key) =>
							updateListIndex(listPaths, key, adjustIndex),
						),
						touchedFields: addItems(
							mapItems(state.touchedFields, (item) =>
								updateListIndex(listPaths, item, adjustIndex),
							),
							[intent.payload.name],
						),
						initialValue: modify(state.initialValue, intent.payload.name, list),
					});
				}
			}
		},
	},
);

export function requestSubmit(
	formElement: HTMLFormElement,
	submitter?: HTMLInputElement | HTMLButtonElement | null,
): void {
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
}

export function requestControl(
	formElement: HTMLFormElement | null | undefined,
	intentName: string,
	intentValue: string,
): void {
	if (!formElement) {
		throw new Error('Form element not found');
	}

	const submitter = document.createElement('button');

	submitter.name = intentName;
	submitter.value = intentValue;
	submitter.hidden = true;
	submitter.formNoValidate = true;

	formElement.appendChild(submitter);
	requestSubmit(formElement, submitter);
	formElement.removeChild(submitter);
}

export type BaseIntent<Type extends string = string> = {
	type: Type;
	payload?: unknown;
};

export function serializeIntent(intent: BaseIntent): string {
	if (!intent.payload) {
		return intent.type;
	}

	return [intent.type, JSON.stringify(intent.payload)].join('/');
}

export function deserializeIntent(value: string): BaseIntent {
	const [type = value, stringifiedPayload] = value.split('/');

	let payload = stringifiedPayload;

	if (stringifiedPayload) {
		try {
			payload = JSON.parse(stringifiedPayload);
		} catch {
			// Ignore the error
		}
	}

	return {
		type,
		payload,
	};
}

export type FormControlIntent<Control extends FormControl<any>> =
	Control extends FormControl<infer Intent> ? Intent : never;

export type FormControl<Intent extends BaseIntent> = {
	isValid(intent: BaseIntent): intent is Intent;
	updateValue(
		submittedValue: Record<string, FormValue>,
		intent: Intent,
	): Record<string, FormValue> | null;
	onSubmit<Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape>,
		context: {
			result: SubmissionResult<Intent, ErrorShape>;
			reset(): FormState<Schema, ErrorShape>;
		},
	): FormState<Schema, ErrorShape>;
};

type Simplify<T> = Pretty<
	{
		[K in keyof T as undefined extends T[K] ? K : never]?: T[K] extends object
			? Simplify<T[K]>
			: T[K];
	} & {
		[K in keyof T as undefined extends T[K] ? never : K]: T[K] extends object
			? Simplify<T[K]>
			: T[K];
	}
>;

export function createFormControl<Intent extends BaseIntent>(
	resolve: (intent: BaseIntent) => Intent | null,
	options: Partial<Omit<FormControl<Simplify<Intent>>, 'isValid'>>,
): FormControl<Simplify<Intent>> {
	return {
		isValid(intent): intent is Intent {
			return resolve(intent) !== null;
		},
		updateValue(submittedValue, intent) {
			if (typeof options.updateValue !== 'function') {
				return submittedValue;
			}

			return options.updateValue(submittedValue, intent);
		},
		onSubmit(state, context) {
			if (typeof options.onSubmit !== 'function') {
				return state;
			}

			return options.onSubmit(state, context);
		},
	};
}

export function combineFormControls<Controls extends Array<FormControl<any>>>(
	controls: Controls,
): FormControl<Controls extends Array<FormControl<infer T>> ? T : never> {
	return {
		isValid(intent): intent is any {
			for (const control of controls) {
				if (control.isValid(intent)) {
					return true;
				}
			}

			return false;
		},
		updateValue(submittedValue, intent) {
			for (const control of controls) {
				if (control.isValid(intent)) {
					const result = control.updateValue(submittedValue, intent);

					if (result === null) {
						return result;
					}

					submittedValue = result;
				}
			}

			return submittedValue;
		},
		onSubmit(state, context) {
			let result = state;

			for (const control of controls) {
				if (control.isValid(context.result.intent)) {
					result = control.onSubmit(result, context);
				}
			}

			return result;
		},
	};
}

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

export type Field<Schema, Metadata extends Record<string, unknown>> = Metadata &
	([Schema] extends [Date | File]
		? {}
		: [Schema] extends [Array<infer Item> | null | undefined]
			? {
					getFieldList: () => Array<Field<Item, Metadata>>;
				}
			: [Schema] extends [Record<string, unknown> | null | undefined]
				? {
						getFieldset: () => Fieldset<Schema, Metadata>;
					}
				: {});

export type Fieldset<Schema, Metadata extends Record<string, unknown>> = {
	[Key in keyof Combine<Schema>]-?: Field<Combine<Schema>[Key], Metadata>;
};

export type FormMetadata<
	Schema extends Record<string, unknown>,
	ErrorShape,
	Props extends Record<string, unknown>,
> = {
	defaultValue: DefaultValue<Schema> | null;
	key: string | null;
	touched: boolean;
	error: ErrorShape | null;
	fieldError: Record<string, ErrorShape> | null;
	props: Props;
};

export function getFormMetadata<
	Schema extends Record<string, unknown>,
	ErrorShape,
	Props extends Record<string, unknown>,
>(
	state: FormState<Schema, ErrorShape>,
	props: Props,
): FormMetadata<Schema, ErrorShape, Props> {
	const name = '';
	const error = state.serverError ?? state.clientError;

	return {
		defaultValue: state.defaultValue,
		error: error?.formError ?? null,
		fieldError: error?.fieldError ?? null,
		get key() {
			return generateKey(state.versionByBranch, name) ?? null;
		},
		get touched() {
			return isTouched(state.touchedFields, name);
		},
		props,
	};
}

export function getFieldMetadata<
	Schema extends Record<string, unknown>,
	ErrorShape,
>(state: FormState<Schema, ErrorShape>, name: string) {
	const error = state.serverError ?? state.clientError;

	return {
		get name() {
			return name;
		},
		get key() {
			return generateKey(state.versionByBranch, name);
		},
		get defaultValue() {
			const paths = getPaths(name);
			const value = getValue(state.initialValue, paths);
			const serializedValue = serialize(value);

			if (
				typeof serializedValue !== 'string' &&
				(!Array.isArray(serializedValue) ||
					serializedValue.some((item) => typeof item !== 'string'))
			) {
				return;
			}

			return serializedValue;
		},
		get touched() {
			return isTouched(state.touchedFields, name);
		},
		get error() {
			const result = name ? error?.fieldError[name] : error?.formError;

			if (!result || !isTouched(state.touchedFields, name)) {
				return;
			}

			return result;
		},
	};
}

export function getFieldset<
	Schema extends Record<string, unknown>,
	ErrorShape,
	Metadata extends Record<string, unknown> = {},
	FieldSchema = Schema,
>(
	state: FormState<Schema, ErrorShape>,
	options?: {
		name?: string;
		metadata?: (state: FormState<Schema, ErrorShape>, name: string) => Metadata;
	},
): Fieldset<FieldSchema, Metadata> {
	function createField(name: string) {
		const metadata = options?.metadata?.(state, name) ?? {};

		return Object.assign(metadata, {
			getFieldset() {
				return getFieldset(state, {
					...options,
					name,
				});
			},
			getFieldList() {
				const paths = getPaths(name);
				const value = getValue(state.initialValue, paths) ?? [];

				if (!Array.isArray(value)) {
					throw new Error(
						`The value of "${name}" is not an array. Are you looking for getFieldset()?`,
					);
				}

				return Array(value.length)
					.fill(0)
					.map((_, index) => createField(formatName(name, index)));
			},
		});
	}

	return new Proxy({} as any, {
		get(target, key, receiver) {
			if (typeof key !== 'string') {
				return Reflect.get(target, key, receiver);
			}

			return createField(formatName(options?.name, key));
		},
	});
}
