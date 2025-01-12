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
	Intent = string | null,
	Schema = unknown,
	ErrorShape = unknown,
	FormValueType extends FormDataEntryValue = FormDataEntryValue,
> = {
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

export function mergeObjects<
	Obj extends Record<string | number | symbol, unknown>,
>(obj1: Obj, obj2: Obj, overwrite: boolean) {
	let result = obj1;

	for (const key in obj2) {
		const val1 = obj1[key];
		const val2 = obj2[key];

		let value = val2 ?? val1;

		// If both ojects have the same key, determine how to merge
		if (Object.prototype.hasOwnProperty.call(obj1, key)) {
			if (Array.isArray(val1) && Array.isArray(val2)) {
				value = val2;
			} else if (isPlainObject(val1) && isPlainObject(val2)) {
				value = mergeObjects(val1, val2, overwrite);
			} else {
				value = overwrite ? val2 : val1;
			}
		}

		if (result[key] !== value) {
			if (result === obj1) {
				// If the result is still the same object, clone it
				result = setValue(obj1, [key], value, shallowClone);
			} else {
				// Otherwise, update the result object
				result[key] = value;
			}
		}
	}

	return result;
}

export type SerializedValue =
	| string
	| undefined
	| SerializedValue[]
	| { [key: string]: SerializedValue };

export function defaultSerialize(value: unknown): SerializedValue {
	if (typeof value === 'string') {
		return value;
	}

	if (isPlainObject(value)) {
		return Object.entries(value).reduce<Record<string, SerializedValue>>(
			(result, [key, value]) => {
				result[key] = defaultSerialize(value);
				return result;
			},
			{},
		);
	} else if (Array.isArray(value)) {
		return value.map(defaultSerialize);
	} else if (value instanceof Date) {
		return value.toISOString();
	} else if (typeof value === 'boolean') {
		return value ? 'on' : undefined;
	} else if (typeof value === 'number' || typeof value === 'bigint') {
		return value.toString();
	}

	return undefined;
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

export function modify<Data>(
	data: Record<string, Data>,
	name: string,
	value: Data | Record<string, Data>,
	overwrite = true,
): Record<string, Data> {
	if (name === '') {
		if (!isPlainObject(value)) {
			throw new Error('The value must be an object');
		}

		return mergeObjects(data, value, overwrite);
	}

	const paths = getPaths(name);
	const prevValue = getValue(data, paths);
	const nextValue =
		isPlainObject(prevValue) && isPlainObject(value)
			? mergeObjects(prevValue, value, overwrite)
			: value;

	if (deepEqual(prevValue, nextValue)) {
		return data;
	}

	return setValue(data, paths, nextValue, shallowClone);
}

/**
 * Create a copy of the object with the updated properties if there is any change
 */
export function updateObject<Obj extends Record<string, any>>(
	obj: Obj,
	update: Partial<Obj>,
): Obj {
	if (
		obj === update ||
		Object.entries(update).every(([key, value]) => obj[key] === value)
	) {
		return obj;
	}

	return Object.assign({}, obj, update);
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

export function parseSubmission(
	formData: FormData | URLSearchParams,
	options?: {
		intentName: string;
	},
): Submission<string | null> {
	const { intentName = '__intent__' } = options ?? {};
	const initialValue: Record<string, any> = {};
	const fields = new Set<string>();

	for (const [name, value] of formData.entries()) {
		if (name !== intentName) {
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

	const submission: Submission<string | null> = {
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
			type: 'server' | 'client';
			result: Submission<UnknownIntent | null, Schema, ErrorShape>;
			reset: () => FormState<Schema, ErrorShape, AdditionalState>;
		},
	): FormState<Schema, ErrorShape, AdditionalState>;
	serializeIntent(intent: UnknownIntent): string;
	deserializeIntent(value: string): UnknownIntent;
	parseIntent(intent: UnknownIntent): Intent | null;
	updateValue(
		value: Record<string, FormValue>,
		intent: Intent,
	): Record<string, FormValue> | null;
	hasSideEffect(intent: Intent): boolean;
	applySideEffect<Schema, ErrorShape>(
		formElement: HTMLFormElement,
		intent: Intent,
		state: FormState<Schema, ErrorShape, AdditionalState>,
	): void;
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
			payload?: string;
	  }
	| {
			type: 'update';
			payload: {
				name?: string;
				index?: number;
				value: FormValue<string>;
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

export function applyIntent<Schema, ErrorShape>(
	submission:
		| Submission<string | null>
		| Submission<string | null, Schema, ErrorShape>,
	options?: {
		control?: undefined;
		pendingIntents?: Array<FormControlIntent<typeof defaultFormControl>>;
	},
): Submission<
	FormControlIntent<typeof defaultFormControl> | null,
	Schema,
	ErrorShape
>;
export function applyIntent<Intent extends UnknownIntent, Schema, ErrorShape>(
	submission:
		| Submission<string | null>
		| Submission<string | null, Schema, ErrorShape>,
	options: {
		control: FormControl<Intent, any>;
		pendingIntents?: Array<Intent>;
	},
): Submission<Intent | null, Schema, ErrorShape>;
export function applyIntent<Intent extends UnknownIntent, Schema, ErrorShape>(
	submission:
		| Submission<string | null>
		| Submission<string | null, Schema, ErrorShape>,
	options?: {
		control?: FormControl<
			Intent | FormControlIntent<typeof defaultFormControl>,
			any
		>;
		pendingIntents?: Array<
			Intent | FormControlIntent<typeof defaultFormControl>
		>;
	},
): Submission<
	Intent | FormControlIntent<typeof defaultFormControl> | null,
	Schema,
	ErrorShape
> {
	const { control = defaultFormControl, pendingIntents = [] } = options ?? {};

	const unknownIntent = submission.intent
		? control.deserializeIntent(submission.intent)
		: null;
	const intent = unknownIntent ? control.parseIntent(unknownIntent) : null;

	let value: Record<string, FormValue> | null = submission.value;

	for (const pendingIntent of pendingIntents.concat(intent ?? [])) {
		if (value === null) {
			break;
		}

		value = control.updateValue(value, pendingIntent);
	}

	return {
		...submission,
		error: undefined,
		value,
		intent,
	};
}

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

	function isNonNullable<T>(value: T): value is NonNullable<T> {
		return value !== null && value !== undefined;
	}

	function isString(value: unknown): value is string {
		return typeof value === 'string';
	}

	function isNumber(value: unknown): value is number {
		return typeof value === 'number';
	}

	function isOptionalString(value: unknown): value is string | undefined {
		return typeof value === 'undefined' || typeof value === 'string';
	}

	function isOptionalNumber(value: unknown): value is number | undefined {
		return typeof value === 'undefined' || typeof value === 'number';
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
					isOptionalString(intent.payload.name) &&
					isNonNullable(intent.payload.value) &&
					isOptionalNumber(intent.payload.index)
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
					isString(intent.payload.name) &&
					isOptionalNumber(intent.payload.index)
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
					isString(intent.payload.name) &&
					isNumber(intent.payload.index)
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
					isString(intent.payload.name) &&
					isNumber(intent.payload.from) &&
					isNumber(intent.payload.to)
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

	function handleIntent<Schema, ErrorShape>(
		state: FormState<Schema, ErrorShape>,
		result: Submission<UnknownIntent | null, Schema, ErrorShape>,
		initialized = false,
	): FormState<Schema, ErrorShape> | null {
		const intent = result.intent ? parseIntent(result.intent) : null;

		if (intent) {
			switch (intent.type) {
				case 'reset': {
					return null;
				}
				case 'update': {
					if (!initialized) {
						return state;
					}

					const initialValue = modify(
						state.initialValue,
						formatName(intent.payload.name, intent.payload.index),
						intent.payload.value,
						false,
					);

					if (state.initialValue === initialValue) {
						return state;
					}

					return {
						...state,
						initialValue,
					};
				}
				case 'validate': {
					const name = intent.payload ?? '';

					if (name === '') {
						const fields = getFields(result);

						return {
							...state,
							touchedFields: deepEqual(state.touchedFields, fields)
								? state.touchedFields
								: fields,
						};
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
					const updateListIndex = configureListIndexUpdate(
						intent.payload.name,
						(currentIndex) =>
							index <= currentIndex ? currentIndex + 1 : currentIndex,
					);
					const touchedFields = addItems(
						mapItems(state.touchedFields, updateListIndex),
						[intent.payload.name],
					);

					if (!initialized) {
						return {
							...state,
							touchedFields,
						};
					}

					list.splice(index, 0, intent.payload.defaultValue);

					const itemName = formatName(intent.payload.name, index);

					return {
						...state,
						keys: {
							...getKeys(
								intent.payload.defaultValue,
								mapKeys(state.keys, updateListIndex),
								itemName,
							),
							[itemName]: generateKey(),
						},
						initialValue: modify(
							state.initialValue,
							intent.payload.name,
							list,
							false,
						),
						touchedFields,
					};
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
					const touchedFields = addItems(
						mapItems(state.touchedFields, updateListIndex),
						[intent.payload.name],
					);

					if (!initialized) {
						return {
							...state,
							touchedFields,
						};
					}

					list.splice(intent.payload.index, 1);

					return {
						...state,
						keys: mapKeys(state.keys, updateListIndex),
						initialValue: modify(
							state.initialValue,
							intent.payload.name,
							list,
							false,
						),
						touchedFields,
					};
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
					const touchedFields = addItems(
						mapItems(state.touchedFields, updateListIndex),
						[intent.payload.name],
					);

					if (!initialized) {
						return {
							...state,
							touchedFields,
						};
					}

					list.splice(
						intent.payload.to,
						0,
						...list.splice(intent.payload.from, 1),
					);

					return {
						...state,
						keys: mapKeys(state.keys, updateListIndex),
						initialValue: modify(
							state.initialValue,
							intent.payload.name,
							list,
							false,
						),
						touchedFields,
					};
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
			const initialValue = result?.value ?? defaultValue ?? {};
			const state: FormState<Schema, ErrorShape> = {
				keys: getKeys(initialValue),
				defaultValue: defaultValue ?? null,
				initialValue: initialValue,
				submittedValue: result?.value ?? null,
				serverError: result?.error ?? null,
				clientError: null,
				touchedFields: result?.intent === null ? getFields(result) : [],
			};

			if (!result) {
				return state;
			}

			return updateObject(state, handleIntent(state, result) ?? state);
		},
		updateState(state, { type, result, reset }) {
			const fields = getFields(result);
			const updatedState = updateObject(state, {
				clientError:
					type === 'client' &&
					typeof result.error !== 'undefined' &&
					!deepEqual(state.clientError, result.error)
						? result.error
						: state.clientError,
				serverError:
					type === 'client' &&
					typeof result.error !== 'undefined' &&
					!deepEqual(state.submittedValue, result.value)
						? null
						: type === 'server' &&
							  typeof result.error !== 'undefined' &&
							  !deepEqual(state.serverError, result.error)
							? result.error
							: state.serverError,
				submittedValue: type === 'server' ? result.value : state.submittedValue,
				touchedFields:
					result?.intent === null && !deepEqual(state.touchedFields, fields)
						? fields
						: state.touchedFields,
			});

			if (type === 'server') {
				return updatedState;
			}

			return updateObject(
				updatedState,
				handleIntent(updatedState, result, true) ?? reset(),
			);
		},
		deserializeIntent(value) {
			return deserializeIntent(value);
		},
		serializeIntent(intent) {
			return serializeIntent(intent);
		},
		parseIntent,
		updateValue(value, intent) {
			switch (intent.type) {
				case 'reset': {
					return null;
				}
				case 'update': {
					return modify(
						value,
						formatName(intent.payload.name, intent.payload.index),
						intent.payload.value,
					);
				}
				case 'insert': {
					const list = getList(value, intent.payload.name);
					list.splice(
						intent.payload.index ?? list.length,
						0,
						intent.payload.defaultValue,
					);

					return modify(value, intent.payload.name, list);
				}
				case 'remove': {
					const list = getList(value, intent.payload.name);
					list.splice(intent.payload.index, 1);
					return modify(value, intent.payload.name, list);
				}
				case 'reorder': {
					const list = getList(value, intent.payload.name);
					list.splice(
						intent.payload.to,
						0,
						...list.splice(intent.payload.from, 1),
					);
					return modify(value, intent.payload.name, list);
				}
			}

			return value;
		},
		hasSideEffect(intent) {
			return intent.type === 'reset' || intent.type === 'update';
		},
		applySideEffect(formElement, intent, state) {
			switch (intent.type) {
				case 'reset': {
					for (const element of formElement.elements) {
						if (isInput(element)) {
							initializeElement(element, {
								initialValue: state.initialValue,
								isResetting: true,
							});
						}
					}
					formElement.reset();
					break;
				}
				case 'update': {
					const flattenedValue = flatten(
						intent.payload.value,
						(value) => value,
						formatName(intent.payload.name, intent.payload.index),
					);

					for (const element of formElement.elements) {
						if (isInput(element)) {
							const value = defaultSerialize(flattenedValue[element.name]);

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
					break;
				}
			}
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
	initialValue: unknown,
	name: string,
	serialize: (value: unknown) => SerializedValue = defaultSerialize,
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

export function initializeElement(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	config: {
		initialValue: Record<string, unknown>;
		isResetting?: boolean;
	},
): void {
	// Skip elements that are already initialized
	if (!config.isResetting && element.dataset.conform) {
		return;
	}

	const defaultValue = getDefaultValue(config.initialValue, element.name);

	updateField(element, {
		defaultValue,
		value: !config.isResetting ? defaultValue : undefined,
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
