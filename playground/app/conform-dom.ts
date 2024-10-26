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

export const validateControl = defineControl<{ name?: string }>({
	serialize(payload) {
		return payload.name ?? '';
	},
	deserialize(value) {
		return { name: value };
	},
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
});

export const updateControl = defineControl<{
	name: string;
	index?: number;
	value?: any;
}>({
	onParse(value, payload) {
		return modify(
			value,
			formatName(payload.name, payload.index),
			payload.value,
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

export const listControl = defineControl<
	| {
			action: 'insert';
			name: string;
			index?: number;
			defaultValue?: any;
	  }
	| {
			action: 'remove';
			name: string;
			index: number;
	  }
	| {
			action: 'reorder';
			name: string;
			from: number;
			to: number;
	  }
>({
	onParse(value, payload) {
		const paths = getPaths(payload.name);
		const data = getValue(value, paths) ?? [];

		if (!Array.isArray(data)) {
			throw new Error(
				`Update list value failed; The value at "${payload.name}" is not an array`,
			);
		}

		// Clone the array to before mutating
		const list = Array.from(data);

		switch (payload.action) {
			case 'insert': {
				list.splice(payload.index ?? list.length, 0, payload.defaultValue);
				break;
			}
			case 'remove': {
				list.splice(payload.index, 1);
				break;
			}
			case 'reorder': {
				list.splice(payload.to, 0, ...list.splice(payload.from, 1));
				break;
			}
		}

		return modify(value, payload.name, list);
	},
	onSubmit(state, { result }) {
		const payload = result.intent.payload;
		const paths = getPaths(payload.name);
		const data = getValue(state.initialValue, paths) ?? [];

		if (!Array.isArray(data)) {
			throw new Error(
				`Update state failed; The initialValue at "${payload.name}" is not an array`,
			);
		}

		const list = Array.from(data);
		const listPaths = getPaths(payload.name);

		switch (payload.action) {
			case 'insert': {
				const index = payload.index ?? list.length;
				const adjustIndex = (currentIndex: number) =>
					index <= currentIndex ? currentIndex + 1 : currentIndex;

				list.splice(payload.index ?? list.length, 0, payload.defaultValue);

				return merge(state, {
					versionByBranch: updateVersionByBranch(
						mapKeys(state.versionByBranch, (key) =>
							updateListIndex(listPaths, key, adjustIndex),
						),
						payload.defaultValue,
						formatName(payload.name, index),
					),
					touchedFields: addItems(
						mapItems(state.touchedFields, (key) =>
							updateListIndex(listPaths, key, adjustIndex),
						),
						[payload.name],
					),
					initialValue: modify(state.initialValue, payload.name, list),
				});
			}
			case 'remove': {
				const adjustIndex = (currentIndex: number) => {
					if (payload.index === currentIndex) {
						return null;
					}

					return payload.index < currentIndex ? currentIndex - 1 : currentIndex;
				};

				list.splice(payload.index, 1);

				return merge(state, {
					versionByBranch: mapKeys(state.versionByBranch, (key) =>
						updateListIndex(listPaths, key, adjustIndex),
					),
					touchedFields: addItems(
						mapItems(state.touchedFields, (key) =>
							updateListIndex(listPaths, key, adjustIndex),
						),
						[payload.name],
					),
					initialValue: modify(state.initialValue, payload.name, list),
				});
			}
			case 'reorder': {
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
					versionByBranch: mapKeys(state.versionByBranch, (key) =>
						updateListIndex(listPaths, key, adjustIndex),
					),
					touchedFields: addItems(
						mapItems(state.touchedFields, (item) =>
							updateListIndex(listPaths, item, adjustIndex),
						),
						[payload.name],
					),
					initialValue: modify(state.initialValue, payload.name, list),
				});
			}
		}
	},
});

export const controls = createFormControls({
	validate: validateControl,
	update: updateControl,
	reset: resetControl,
	list: listControl,
});

export function dispatchIntent(
	formElement: HTMLFormElement | null,
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
}

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
			dispatchIntent(formElement, intentName, this.serialize(intent));
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
				return generateKey(state.versionByBranch, name);
			},
			get defaultValue() {
				const serializedValue = serialize(state.initialValue);
				const paths = getPaths(name);
				const value = getValue(serializedValue, paths);

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
				return isTouched(state.touchedFields, name);
			},
			get error() {
				const result = name ? error?.fieldError[name] : error?.formError;

				if (!result || !isTouched(state.touchedFields, name)) {
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
											const paths = getPaths(fieldName);
											const value = getValue(state.initialValue, paths) ?? [];

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
