export type FormValue<Entry extends FormDataEntryValue = FormDataEntryValue> =
	| Entry
	| FormValue<Entry>[]
	| { [key: string]: FormValue<Entry> };

export type FormError<Schema, ErrorShape> = {
	formError: ErrorShape | null;
	fieldError: Record<string, ErrorShape>;
	'#schema'?: Schema;
};

export type Submission<
	Intent = null,
	Schema = unknown,
	ErrorShape = unknown,
	FormValueType extends FormDataEntryValue = FormDataEntryValue,
> = {
	type: 'client' | 'server';
	fields: string[];
	value: Record<string, FormValue<FormValueType>> | null;
	intent: Intent;
	error?: FormError<Schema, ErrorShape> | null;
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

export type FormState<
	Schema,
	ErrorShape,
	State extends Record<string, unknown> = {},
> = {
	defaultValue: DefaultValue<Schema> | null;
	serverError: FormError<Schema, ErrorShape> | null;
	clientError: FormError<Schema, ErrorShape> | null;
	initialValue: Record<string, FormValue>;
	submittedValue: Record<string, FormValue> | null;
	touchedFields: string[];
	keys: Record<string, string>;
} & State;

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

export function generateKey(): string {
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

export function getKeys(
	defaultValue: unknown,
	prevkeys: Record<string, string> = {},
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
				result[formatPaths(paths.concat(i))] = generateKey();
			}

			return result;
		},
		prefix
			? mapKeys(prevkeys, (key) => (!isPrefix(key, prefix) ? key : null))
			: prevkeys,
	);

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

export type Fallback<MainType, FallbackType> = unknown extends MainType
	? FallbackType
	: MainType;

export type SubmissionSchema<SubmissionType> =
	SubmissionType extends Submission<any, infer Schema, any, any>
		? Schema
		: unknown;

export type SubmissionErrorShape<SubmissionType> =
	SubmissionType extends Submission<any, any, infer ErrorShape, any>
		? ErrorShape
		: unknown;

export function report<
	SubmissionType extends Submission<any, any, any>,
	Schema,
	ErrorShape = string[],
>(
	submission: SubmissionType,
	options: {
		type?: SubmissionType['type'];
		error?: Partial<
			FormError<
				Fallback<SubmissionSchema<SubmissionType>, Schema>,
				Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>
			>
		> | null;
		keepFile: true;
	},
): Submission<
	SubmissionType extends Submission<infer Intent, any, any> ? Intent : unknown,
	Fallback<SubmissionSchema<SubmissionType>, Schema>,
	Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>,
	SubmissionType extends Submission<any, any, any, infer FormValueType>
		? FormValueType
		: FormDataEntryValue
>;
export function report<
	SubmissionType extends Submission<any, any, any>,
	Schema,
	ErrorShape = string[],
>(
	submission: SubmissionType,
	options: {
		type?: SubmissionType['type'];
		error?: Partial<
			FormError<
				Fallback<SubmissionSchema<SubmissionType>, Schema>,
				Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>
			>
		> | null;
		keepFile?: false;
	},
): Submission<
	SubmissionType extends Submission<infer Intent, any, any> ? Intent : unknown,
	Fallback<SubmissionSchema<SubmissionType>, Schema>,
	Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>,
	string
>;
export function report<
	SubmissionType extends Submission<any, any, any>,
	Schema,
	ErrorShape = string[],
>(
	submission: SubmissionType,
	options: {
		type?: SubmissionType['type'];
		error?: Partial<
			FormError<
				Fallback<SubmissionSchema<SubmissionType>, Schema>,
				Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>
			>
		> | null;
		keepFile?: boolean;
	},
): Submission<
	SubmissionType extends Submission<infer Intent, any, any> ? Intent : unknown,
	Fallback<SubmissionSchema<SubmissionType>, Schema>,
	Fallback<SubmissionErrorShape<SubmissionType>, ErrorShape>,
	SubmissionType extends Submission<any, any, any, infer FormValueType>
		? FormValueType
		: FormDataEntryValue
> {
	return {
		type: options.type ?? submission.type,
		// @ts-expect-error TODO: remove all files from submission.value
		value: options.keepFile ? submission.value : submission.value,
		error:
			typeof options.error === 'undefined'
				? submission.error
				: options.error === null
					? null
					: {
							formError: options.error.formError ?? null,
							fieldError: options.error.fieldError ?? {},
						},
		fields: submission.fields,
		intent: submission.intent,
	};
}

export function parseSubmission<Schema, ErrorShape>(
	formData: FormData | URLSearchParams,
): Submission<null, Schema, ErrorShape>;
export function parseSubmission<Schema, ErrorShape>(
	formData: FormData | URLSearchParams,
	options: {
		intentName: string;
	},
): Submission<string | null, Schema, ErrorShape>;
export function parseSubmission<Schema, ErrorShape>(
	formData: FormData | URLSearchParams,
	options?: {
		intentName: string;
	},
): Submission<string | null, Schema, ErrorShape> {
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

	const submission: Submission<string | null, Schema, ErrorShape> = {
		type: typeof document !== 'undefined' ? 'client' : 'server',
		value: initialValue,
		fields: Array.from(fields),
		intent: null,
	};

	if (options) {
		const intent = formData.get(options.intentName);

		if (typeof intent === 'string') {
			submission.intent = intent;
		}
	}

	return submission;
}

/**
 * Check if the event target is an input element in the form
 * @param target Event target
 * @param formElement The form element associated with
 */
export function isInput(
	target: unknown,
	formElement?: HTMLFormElement | null,
): target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
	return (
		(target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement) &&
		(formElement ? target.form === formElement : target.form !== null)
	);
}

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

export function configureListIndexUpdate(
	listName: string,
	update: (index: number) => number | null,
): (name: string) => string | null {
	const listPaths = getPaths(listName);

	return (name: string) => {
		const paths = getPaths(name);

		if (
			paths.length > listPaths.length &&
			listPaths.every((path, index) => paths[index] === path)
		) {
			const currentIndex = paths[listPaths.length];

			if (typeof currentIndex === 'number') {
				const newIndex = update(currentIndex);

				if (newIndex === null) {
					// To remove the item instead of updating it
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
	};
}

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

export function requestIntent(
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

export type UnknownIntent = {
	type: string;
	payload?: unknown;
};

export function serializeIntent(intent: UnknownIntent): string {
	if (!intent.payload) {
		return intent.type;
	}

	return [intent.type, JSON.stringify(intent.payload)].join('/');
}

export function deserializeIntent(value: string): UnknownIntent {
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
	Control extends FormControl<infer Intent, any> ? Intent : never;

export type FormControlAdditionalState<Control extends FormControl<any>> =
	Control extends FormControl<any, infer AdditionalState>
		? AdditionalState
		: never;

export type FormControl<
	Intent extends UnknownIntent,
	AdditionalState extends {} = {},
> = {
	initializeState<Schema, ErrorShape>(options: {
		result?: Submission<UnknownIntent | null, Schema, ErrorShape> | null;
		defaultValue?: DefaultValue<Schema>;
	}): FormState<Schema, ErrorShape, AdditionalState>;
	updateState<Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape, AdditionalState>,
		ctx: {
			result: Submission<UnknownIntent | null, Schema, ErrorShape>;
			reset: () => FormState<Schema, ErrorShape, AdditionalState>;
		},
	): FormState<Schema, ErrorShape, AdditionalState>;
	serializeIntent(intent: UnknownIntent): string;
	deserializeIntent(value: string): UnknownIntent;
	parseIntent(intent: UnknownIntent): Intent | null;
	refineSubmission<Schema, ErrorShape>(
		submission: Submission<string | null, Schema, ErrorShape>,
	): Submission<Intent | null, Schema, ErrorShape>;
	getSideEffect(
		intent: Intent,
	): ((formElement: HTMLFormElement) => void) | null;
};

export function createFormControl<
	Intent extends UnknownIntent,
	AdditionalState extends Record<string, unknown> = {},
>(
	configure: () => FormControl<Intent, AdditionalState>,
): FormControl<Intent, AdditionalState> {
	return configure();
}

export type DefaultFormIntent =
	| {
			type: 'validate';
			payload?: string | undefined;
	  }
	| {
			type: 'update';
			payload: {
				name: string;
				index?: number;
				value?: unknown;
			};
	  }
	| {
			type: 'reset';
	  }
	| {
			type: 'insert';
			payload: {
				name: string;
				index?: number;
				defaultValue?: unknown;
			};
	  }
	| {
			type: 'remove';
			payload: {
				name: string;
				index: number;
			};
	  }
	| {
			type: 'reorder';
			payload: {
				name: string;
				from: number;
				to: number;
			};
	  };

export const defaultFormControl = createFormControl<DefaultFormIntent>(() => {
	function getList(initialValue: unknown, name: string) {
		const paths = getPaths(name);
		const data = getValue(initialValue, paths) ?? [];

		if (!Array.isArray(data)) {
			throw new Error(
				`Update state failed; The initialValue at "${name}" is not an array`,
			);
		}

		// Make a copy of the currnet list data
		return Array.from(data);
	}

	function parseIntent(intent: UnknownIntent): DefaultFormIntent | null {
		switch (intent.type) {
			case 'validate': {
				if (
					typeof intent.payload === 'string' ||
					typeof intent.payload === 'undefined'
				) {
					return {
						type: 'validate',
						payload: intent.payload,
					};
				}
				break;
			}
			case 'update': {
				if (
					isPlainObject(intent.payload) &&
					typeof intent.payload.name === 'string' &&
					(typeof intent.payload.index === 'undefined' ||
						typeof intent.payload.index === 'number')
				) {
					return {
						type: 'update',
						payload: {
							name: intent.payload.name,
							index: intent.payload.index,
							value: intent.payload.value,
						},
					};
				}
				break;
			}
			case 'reset': {
				if (intent.payload === undefined) {
					return {
						type: 'reset',
					};
				}
				break;
			}
			case 'insert': {
				if (
					isPlainObject(intent.payload) &&
					typeof intent.payload.name === 'string' &&
					(typeof intent.payload.index === 'undefined' ||
						typeof intent.payload.index === 'number')
				) {
					return {
						type: 'insert',
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
				if (
					isPlainObject(intent.payload) &&
					typeof intent.payload.name === 'string' &&
					typeof intent.payload.index === 'number'
				) {
					return {
						type: 'remove',
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
					isPlainObject(intent.payload) &&
					typeof intent.payload.name === 'string' &&
					typeof intent.payload.from === 'number' &&
					typeof intent.payload.to === 'number'
				) {
					return {
						type: 'reorder',
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

		return null;
	}

	function getFields(submission: Submission<UnknownIntent | null>): string[] {
		const fields = submission.fields;

		// Sometimes we couldn't find out all the fields from the FormData, e.g. unchecked checkboxes
		// But the schema might have an error on those fields, so we need to include them
		if (submission.error) {
			for (const name of Object.keys(submission.error.fieldError)) {
				// If the error is set as a child of an actual field, exclude it
				// e.g. A multi file input field (name="files") but the error is set on the first file (i.e. files[0])
				if (fields.find((field) => name !== field && isPrefix(name, field))) {
					continue;
				}

				// If the name is not a child of any fields, this could be an unchecked checkbox or an empty multi select
				if (fields.every((field) => !isPrefix(field, name))) {
					fields.push(name);
				}
			}
		}

		return fields;
	}

	function handleSubmission<Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape>,
		result: Submission<UnknownIntent | null, Schema, ErrorShape>,
		reset?: () => FormState<Schema, ErrorShape>,
	): FormState<Schema, ErrorShape> {
		if (!result.intent) {
			const fields = getFields(result);

			return merge(state, {
				touchedFields: deepEqual(state.touchedFields, fields)
					? state.touchedFields
					: fields,
			});
		}

		const intent = parseIntent(result.intent);

		if (intent) {
			switch (intent.type) {
				case 'reset': {
					return reset?.() ?? state;
				}
				case 'validate': {
					const name = intent.payload ?? '';

					if (name === '') {
						const fields = getFields(result);

						return merge(state, {
							touchedFields: deepEqual(state.touchedFields, fields)
								? state.touchedFields
								: fields,
						});
					}

					if (state.touchedFields.includes(name)) {
						return state;
					}

					return {
						...state,
						touchedFields: state.touchedFields.concat(name),
					};
				}
				case 'insert': {
					const list = getList(state.initialValue, intent.payload.name);
					const index = intent.payload.index ?? list.length;
					const itemName = formatName(intent.payload.name, index);
					const updateListIndex = configureListIndexUpdate(
						intent.payload.name,
						(currentIndex) =>
							index <= currentIndex ? currentIndex + 1 : currentIndex,
					);

					list.splice(
						intent.payload.index ?? list.length,
						0,
						intent.payload.defaultValue,
					);

					return merge(state, {
						keys: {
							...getKeys(
								intent.payload.defaultValue,
								mapKeys(state.keys, updateListIndex),
								itemName,
							),
							[itemName]: generateKey(),
						},
						touchedFields: addItems(
							mapItems(state.touchedFields, updateListIndex),
							[intent.payload.name],
						),
						initialValue: modify(state.initialValue, intent.payload.name, list),
					});
				}
				case 'remove': {
					const list = getList(state.initialValue, intent.payload.name);
					const updateListIndex = configureListIndexUpdate(
						intent.payload.name,
						(currentIndex) => {
							if (intent.payload.index === currentIndex) {
								return null;
							}

							return intent.payload.index < currentIndex
								? currentIndex - 1
								: currentIndex;
						},
					);

					list.splice(intent.payload.index, 1);

					return merge(state, {
						keys: mapKeys(state.keys, updateListIndex),
						touchedFields: addItems(
							mapItems(state.touchedFields, updateListIndex),
							[intent.payload.name],
						),
						initialValue: modify(state.initialValue, intent.payload.name, list),
					});
				}
				case 'reorder': {
					const list = getList(state.initialValue, intent.payload.name);
					const updateListIndex = configureListIndexUpdate(
						intent.payload.name,
						(currentIndex) => {
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
						},
					);

					list.splice(
						intent.payload.to,
						0,
						...list.splice(intent.payload.from, 1),
					);

					return merge(state, {
						keys: mapKeys(state.keys, updateListIndex),
						touchedFields: addItems(
							mapItems(state.touchedFields, updateListIndex),
							[intent.payload.name],
						),
						initialValue: modify(state.initialValue, intent.payload.name, list),
					});
				}
			}
		}

		return state;
	}

	return {
		initializeState<Schema, ErrorShape>({
			defaultValue,
			result,
		}: {
			defaultValue?: DefaultValue<Schema>;
			result?: Submission<DefaultFormIntent | null, Schema, ErrorShape>;
		}) {
			const state: FormState<Schema, ErrorShape> = {
				keys: getKeys(defaultValue),
				defaultValue: defaultValue ?? null,
				initialValue: result?.value ?? defaultValue ?? {},
				submittedValue: result?.value ?? null,
				serverError:
					result?.type === 'server' && result.error ? result.error : null,
				clientError:
					result?.type === 'client' && result.error ? result.error : null,
				touchedFields: [],
			};

			if (!result) {
				return state;
			}

			return handleSubmission(state, result);
		},
		updateState(state, { result, reset }) {
			const updatedState = merge(state, {
				clientError:
					result.type === 'client' &&
					typeof result.error !== 'undefined' &&
					!deepEqual(state.clientError, result.error)
						? result.error
						: state.clientError,
				serverError:
					result.type === 'client' &&
					!deepEqual(state.submittedValue, result.value)
						? null
						: result.type === 'server' &&
							  typeof result.error !== 'undefined' &&
							  !deepEqual(state.serverError, result.error)
							? result.error
							: state.serverError,
				submittedValue:
					result.type === 'server' ? result.value : state.submittedValue,
			});

			return handleSubmission(updatedState, result, reset);
		},
		deserializeIntent(value) {
			return deserializeIntent(value);
		},
		serializeIntent(intent) {
			return serializeIntent(intent);
		},
		parseIntent,
		refineSubmission(submission) {
			const unknownIntent = submission.intent
				? deserializeIntent(submission.intent)
				: null;
			const intent = unknownIntent ? parseIntent(unknownIntent) : null;

			let value = submission.value;

			if (value) {
				switch (intent?.type) {
					case 'reset': {
						value = null;
						break;
					}
					case 'update': {
						value = modify(
							value,
							formatName(intent.payload.name, intent.payload.index),
							intent.payload.value,
						);
						break;
					}
					case 'insert': {
						const list = getList(value, intent.payload.name);
						list.splice(
							intent.payload.index ?? list.length,
							0,
							intent.payload.defaultValue,
						);

						value = modify(value, intent.payload.name, list);
						break;
					}
					case 'remove': {
						const list = getList(value, intent.payload.name);
						list.splice(intent.payload.index, 1);
						value = modify(value, intent.payload.name, list);
						break;
					}
					case 'reorder': {
						const list = getList(value, intent.payload.name);
						list.splice(
							intent.payload.to,
							0,
							...list.splice(intent.payload.from, 1),
						);
						value = modify(value, intent.payload.name, list);
						break;
					}
				}
			}

			return {
				...submission,
				value,
				intent,
			};
		},
		getSideEffect(intent) {
			switch (intent?.type) {
				case 'reset': {
					return (formElement) => {
						formElement.reset();
					};
				}
				case 'update': {
					return (formElement) => {
						const flattenedValue = flatten(
							intent.payload.value,
							(value) => value,
							formatName(intent.payload.name, intent.payload.index),
						);

						for (const element of formElement.elements) {
							if (isInput(element)) {
								const value = serialize(flattenedValue[element.name]);

								updateField(element, {
									value:
										typeof value === 'string' ||
										(Array.isArray(value) &&
											value.every((item) => typeof item === 'string'))
											? value
											: undefined,
								});

								// Update the element attribute to notify that this is changed by Conform
								element.dataset.conform = generateKey();
							}
						}
					};
				}
			}

			return null;
		},
	};
});

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

export type FormMetadata<Schema extends Record<string, unknown>, ErrorShape> = {
	defaultValue: DefaultValue<Schema> | null;
	touched: boolean;
	error: ErrorShape | null;
	fieldError: Record<string, ErrorShape> | null;
};

export function getFormMetadata<
	Schema extends Record<string, unknown>,
	ErrorShape,
>(state: FormState<Schema, ErrorShape>): FormMetadata<Schema, ErrorShape> {
	const error = state.serverError ?? state.clientError;

	return {
		defaultValue: state.defaultValue,
		error: error?.formError ?? null,
		fieldError: error?.fieldError ?? null,
		get touched() {
			return isTouched(state.touchedFields);
		},
	};
}

export function getDefaultValue(
	initialValue: Record<string, unknown>,
	name: string,
): string | string[] | undefined {
	const paths = getPaths(name);
	const value = getValue(initialValue, paths);
	const serializedValue = serialize(value);

	if (
		typeof serializedValue !== 'string' &&
		(!Array.isArray(serializedValue) ||
			!serializedValue.every((item) => typeof item === 'string'))
	) {
		return;
	}

	return serializedValue;
}

export function getError<ErrorShape>(
	error: FormError<unknown, ErrorShape> | null,
	touchedFields: string[],
	name?: string,
): ErrorShape | undefined {
	if (!isTouched(touchedFields, name) || !error) {
		return;
	}

	return (name ? error.fieldError[name] : error.formError) ?? undefined;
}

export function getListInitialValue(
	initialValue: Record<string, unknown>,
	name: string,
) {
	const paths = getPaths(name);
	const value = getValue(initialValue, paths) ?? [];

	if (!Array.isArray(value)) {
		throw new Error(`The value of "${name}" is not an array`);
	}

	return value;
}

export function createFieldset<
	Schema,
	Metadata extends Record<string, unknown>,
>(
	initialValue: Record<string, unknown>,
	options: {
		name?: string;
		defineMetadata?: (name: string) => Metadata;
	},
): Fieldset<Schema, Metadata> {
	function createField(name: string) {
		const metadata = options?.defineMetadata?.(name) ?? {};

		return Object.assign(metadata, {
			getFieldset() {
				return createFieldset(initialValue, {
					...options,
					name,
				});
			},
			getFieldList() {
				const list = getListInitialValue(initialValue, name);

				return Array(list.length)
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

export function getFieldset<Schema, ErrorShape>(
	state: FormState<Schema, ErrorShape>,
): Fieldset<
	Schema,
	Readonly<{
		name: string;
		key: string | undefined;
		defaultValue: string | string[] | undefined;
		touched: boolean;
		error: ErrorShape | undefined;
	}>
> {
	return createFieldset(state.initialValue, {
		defineMetadata(name) {
			const error = state.serverError ?? state.clientError;

			return {
				get name() {
					return name;
				},
				get key() {
					return state.keys[name];
				},
				get defaultValue() {
					return getDefaultValue(state.initialValue, name);
				},
				get touched() {
					return isTouched(state.touchedFields, name);
				},
				get error() {
					return getError(error, state.touchedFields, name);
				},
			};
		},
	});
}

/**
 * Updates the DOM element based on the given options
 */
export function updateField(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	options: {
		value?: string | string[];
		defaultValue?: string | string[];
		constraint?: {
			required?: boolean;
			minLength?: number;
			maxLength?: number;
			min?: string | number;
			max?: string | number;
			step?: string | number;
			multiple?: boolean;
			pattern?: string;
		};
	},
) {
	const value =
		typeof options.value === 'undefined'
			? null
			: Array.isArray(options.value)
				? options.value
				: [options.value];
	const defaultValue =
		typeof options.defaultValue === 'undefined'
			? null
			: Array.isArray(options.defaultValue)
				? options.defaultValue
				: [options.defaultValue];

	if (options.constraint) {
		const { constraint } = options;

		if (
			typeof constraint.required !== 'undefined' &&
			// If the element is a part of the checkbox group, it is unclear whether all checkboxes are required or only one.
			!(
				element.type === 'checkbox' &&
				element.form?.elements.namedItem(element.name) instanceof RadioNodeList
			)
		) {
			element.required = constraint.required;
		}

		if (typeof constraint.multiple !== 'undefined' && 'multiple' in element) {
			element.multiple = constraint.multiple;
		}

		if (typeof constraint.minLength !== 'undefined' && 'minLength' in element) {
			element.minLength = constraint.minLength;
		}

		if (typeof constraint.maxLength !== 'undefined' && 'maxLength' in element) {
			element.maxLength = constraint.maxLength;
		}
		if (typeof constraint.min !== 'undefined' && 'min' in element) {
			element.min = `${constraint.min}`;
		}

		if (typeof constraint.max !== 'undefined' && 'max' in element) {
			element.max = `${constraint.max}`;
		}

		if (typeof constraint.step !== 'undefined' && 'step' in element) {
			element.step = `${constraint.step}`;
		}

		if (typeof constraint.pattern !== 'undefined' && 'pattern' in element) {
			element.pattern = constraint.pattern;
		}
	}

	if (element instanceof HTMLInputElement) {
		switch (element.type) {
			case 'checkbox':
			case 'radio':
				if (value) {
					element.checked = value.includes(element.value);
				}
				if (defaultValue) {
					element.defaultChecked = defaultValue.includes(element.value);
				}
				break;
			case 'file':
				// Do nothing for now
				break;
			default:
				if (value) {
					element.value = value[0] ?? '';
				}
				if (defaultValue) {
					element.defaultValue = defaultValue[0] ?? '';
				}
				break;
		}
	} else if (element instanceof HTMLSelectElement) {
		for (const option of element.options) {
			if (value) {
				option.selected = value.includes(option.value);
			}
			if (defaultValue) {
				option.defaultSelected = defaultValue.includes(option.value);
			}
		}
	} else {
		if (value) {
			element.value = value[0] ?? '';
		}
		if (defaultValue) {
			element.defaultValue = defaultValue[0] ?? '';
		}
	}
}

/**
 * Reset the field to its default value
 * For file input, it will clear the selected file
 */
export function resetField(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
): void {
	if (element instanceof HTMLInputElement) {
		switch (element.type) {
			case 'checkbox':
			case 'radio':
				element.checked = element.defaultChecked;
				break;
			case 'file':
				element.value = '';
				break;
			default:
				element.value = element.defaultValue;
				break;
		}
	} else if (element instanceof HTMLSelectElement) {
		for (const option of element.options) {
			option.selected = option.defaultSelected;
		}
	} else {
		element.value = element.defaultValue;
	}
}

export function initializeElement(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	initialValue: Record<string, unknown>,
): void {
	// Skip elements that are already initialized
	if (element.dataset.conform) {
		return;
	}

	const defaultValue = getDefaultValue(initialValue, element.name);

	updateField(element, {
		defaultValue,
		value: defaultValue,
	});

	element.dataset.conform = generateKey();
}

export type Memoized<T extends (...args: any) => any> = {
	(this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T>;
	clearCache: () => void;
};

export function memoize<T extends (...args: any) => any>(
	fn: T,
	isEqual: (
		prevArgs: Parameters<T>,
		nextArgs: Parameters<T>,
	) => boolean = deepEqual,
): Memoized<T> {
	let cache: {
		this: ThisParameterType<T>;
		args: Parameters<T>;
		result: ReturnType<T>;
	} | null = null;

	function memoized(this: ThisParameterType<T>, ...args: Parameters<T>) {
		// Check if new arguments match last arguments including the context (this)
		if (cache && cache.this === this && isEqual(cache.args, args)) {
			return cache.result;
		}

		let result = fn.apply(this, args);

		if (result instanceof Promise) {
			result = result.catch((e) => {
				// If the promise is rejected, clear the cache so that the next call will re-invoke fn
				cache = null;

				// Re-throw the exception so that it can be handled by the caller
				throw e;
			});
		}

		// Update the cache
		cache = {
			this: this,
			args,
			result,
		};

		return result;
	}

	memoized.clearCache = function clearCache() {
		cache = null;
	};

	return memoized;
}
