import { isGlobalInstance } from './dom';
import type { DefaultValue, FieldName, FormValue } from './form';
import {
	isPlainObject,
	isPrefix,
	getValueAtPath,
	setValueAtPath,
	appendPathSegment,
} from './formdata';
import { invariant } from './util';

export type SubmissionState = {
	validated: Record<string, boolean>;
};

export type SubmissionPayload<Entry extends FormDataEntryValue> =
	| Entry
	| SubmissionPayload<Entry>[]
	| { [key: string]: SubmissionPayload<Entry> };

export type SubmissionContext<Value = null, FormError = string[]> = {
	intent: Intent | null;
	payload: Record<string, SubmissionPayload<FormDataEntryValue>>;
	fields: Set<string>;
	value?: Value;
	error?: Record<string, FormError | null> | null;
	state?: SubmissionState;
};

export type Submission<Schema, FormError = string[], FormValue = Schema> =
	| {
			status: 'success';
			payload: Record<string, SubmissionPayload<FormDataEntryValue>>;
			value: FormValue;
			reply(options?: ReplyOptions<FormError>): SubmissionResult<FormError>;
	  }
	| {
			status: 'error' | undefined;
			payload: Record<string, SubmissionPayload<FormDataEntryValue>>;
			error: Record<string, FormError | null> | null;
			reply(options?: ReplyOptions<FormError>): SubmissionResult<FormError>;
	  };

export type SubmissionResult<FormError = string[]> = {
	status?: 'error' | 'success';
	intent?: Intent;
	initialValue?: Record<string, SubmissionPayload<string>> | null;
	fields?: string[];
	error?: Record<string, FormError | null>;
	state?: SubmissionState;
};

export type ReplyOptions<FormError> =
	| {
			resetForm?: boolean;
	  }
	| {
			formErrors?: FormError;
			fieldErrors?: Record<string, FormError>;
			hideFields?: string[];
	  };

/**
 * The name to be used when submitting a form control
 */
export const INTENT = '__intent__';

/**
 * The name to be used when submitting a state
 */
export const STATE = '__state__';

export function getSubmissionContext(
	body: FormData | URLSearchParams,
): SubmissionContext {
	const intent = body.get(INTENT);
	const state = body.get(STATE);

	invariant(
		(typeof intent === 'string' || intent === null) &&
			(typeof state === 'string' || state === null),
		`The input name "${INTENT}" and "${STATE}" are reserved by Conform. Please use another name for your input.`,
	);

	const context: SubmissionContext = {
		payload: {},
		fields: new Set(),
		intent: getIntent(intent),
	};

	if (state) {
		context.state = JSON.parse(state);
	}

	for (const [name, next] of body.entries()) {
		if (name === INTENT || name === STATE) {
			continue;
		}

		context.fields.add(name);
		setValueAtPath(
			context.payload,
			name,
			(prev: unknown) => {
				if (!prev) {
					return next;
				} else if (Array.isArray(prev)) {
					return prev.concat(next);
				} else {
					return [prev, next];
				}
			},
			{
				silent: true,
			},
		);
	}

	return context;
}

export function parse<FormValue, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: Intent | null,
		) => { value?: FormValue; error?: Record<string, FormError | null> | null };
	},
): Submission<FormValue, FormError>;
export function parse<FormValue, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: Intent | null,
		) => Promise<{
			value?: FormValue;
			error?: Record<string, FormError | null> | null;
		}>;
	},
): Promise<Submission<FormValue, FormError>>;
export function parse<FormValue, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: Intent | null,
		) =>
			| { value?: FormValue; error?: Record<string, FormError | null> | null }
			| Promise<{
					value?: FormValue;
					error?: Record<string, FormError | null> | null;
			  }>;
	},
): Submission<FormValue, FormError> | Promise<Submission<FormValue, FormError>>;
export function parse<FormValue, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: Intent | null,
		) =>
			| { value?: FormValue; error?: Record<string, FormError | null> | null }
			| Promise<{
					value?: FormValue;
					error?: Record<string, FormError | null> | null;
			  }>;
	},
):
	| Submission<FormValue, FormError>
	| Promise<Submission<FormValue, FormError>> {
	const context = getSubmissionContext(payload);
	const intent = context.intent;

	if (intent) {
		switch (intent.type) {
			case 'update': {
				const name = appendPathSegment(
					intent.payload.name,
					intent.payload.index,
				);
				const value = intent.payload.value;

				if (typeof intent.payload.value !== 'undefined') {
					if (name) {
						setValueAtPath(context.payload, name, () => value);
					} else {
						context.payload = value;
					}
				}
				break;
			}
			case 'reset': {
				const name = appendPathSegment(
					intent.payload.name,
					intent.payload.index,
				);

				if (name) {
					setValueAtPath(context.payload, name, () => undefined);
				} else {
					context.payload = {};
				}
				break;
			}
			case 'insert':
			case 'remove':
			case 'reorder': {
				setListValue(context.payload, intent);
				break;
			}
		}
	}

	const result = options.resolve(context.payload, intent);
	const mergeResolveResult = (resolved: {
		error?: Record<string, FormError | null> | null;
		value?: FormValue;
	}) =>
		createSubmission({
			...context,
			value: resolved.value,
			error: resolved.error,
		});

	if (result instanceof Promise) {
		return result.then(mergeResolveResult);
	}

	return mergeResolveResult(result);
}

export function createSubmission<FormValue, FormError>(
	context: SubmissionContext<FormValue, FormError>,
): Submission<FormValue, FormError> {
	if (context.intent || !context.value || context.error) {
		return {
			status: !context.intent ? 'error' : undefined,
			payload: context.payload,
			error: typeof context.error !== 'undefined' ? context.error : {},
			reply(options) {
				return replySubmission(context, options);
			},
		};
	}

	return {
		status: 'success',
		payload: context.payload,
		value: context.value,
		reply(options) {
			return replySubmission(context, options);
		},
	};
}

export function replySubmission<FormError>(
	context: SubmissionContext<unknown, FormError>,
	options: ReplyOptions<FormError> = {},
): SubmissionResult<FormError> {
	if (
		('resetForm' in options && options.resetForm) ||
		(context.intent?.type === 'reset' &&
			(context.intent.payload.name ?? '') === '')
	) {
		return { initialValue: null };
	}

	if ('hideFields' in options && options.hideFields) {
		for (const name of options.hideFields) {
			const value = getValueAtPath(context.payload, name);

			if (typeof value !== 'undefined') {
				setValueAtPath(context.payload, name, () => undefined);
			}
		}
	}

	const extraError =
		'formErrors' in options || 'fieldErrors' in options
			? normalize<Record<string, FormError | null>>({
					'': options.formErrors ?? null,
					...options.fieldErrors,
				})
			: null;
	const error =
		context.error || extraError
			? {
					...context.error,
					...extraError,
				}
			: undefined;

	const initialValue =
		(normalize(
			context.payload,
			// We can't serialize the file and send it back from the server, but we can preserve it in the client
			typeof document !== 'undefined',
			// We need the file on the client because it's treated as the form value
			// But we will exclude the File type for now as it's only used by the internal
			// form state and we will remove the need to preserve the file on the client soon
		) as Record<string, SubmissionPayload<string>>) ?? {};

	return {
		status: context.intent ? undefined : error ? 'error' : 'success',
		intent: context.intent ? context.intent : undefined,
		initialValue,
		error,
		state: context.state,
		fields: Array.from(context.fields),
	};
}

export type ValidateIntent<Schema = any> = {
	type: 'validate';
	payload: {
		name?: FieldName<Schema>;
	};
};

export type ResetIntent<Schema = any> = {
	type: 'reset';
	payload:
		| {
				name?: FieldName<Schema>;
				index?: never;
		  }
		| {
				name: FieldName<Schema>;
				index: Schema extends Array<unknown> ? number : never;
		  };
};

export type UpdateIntent<Schema = any> = {
	type: 'update';
	payload:
		| {
				name?: FieldName<Schema>;
				index?: never;
				value?: NonNullable<DefaultValue<Schema>>;
				validated?: boolean;
		  }
		| {
				name: FieldName<Schema>;
				index: Schema extends Array<unknown> ? number : never;
				value?: Schema extends Array<infer Item>
					? NonNullable<DefaultValue<Item>>
					: never;
				validated?: boolean;
		  };
};

export type RemoveIntent<Schema = any> = {
	type: 'remove';
	payload: {
		name: FieldName<Schema>;
		index: number;
	};
};

export type InsertIntent<Schema = any> = {
	type: 'insert';
	payload: {
		name: FieldName<Schema>;
		defaultValue?: Schema extends Array<infer Item>
			? DefaultValue<Item>
			: never;
		index?: number;
	};
};

export type ReorderIntent<Schema = any> = {
	type: 'reorder';
	payload: {
		name: FieldName<Schema>;
		from: number;
		to: number;
	};
};

export type Intent<Schema = any> =
	| ValidateIntent<Schema>
	| ResetIntent<Schema>
	| UpdateIntent<Schema>
	| ReorderIntent<Schema>
	| RemoveIntent<Schema>
	| InsertIntent<Schema>;

export function getIntent(
	serializedIntent: string | null | undefined,
): Intent | null {
	if (!serializedIntent) {
		return null;
	}

	const control = JSON.parse(serializedIntent);

	if (
		typeof control.type !== 'string' ||
		typeof control.payload === 'undefined'
	) {
		throw new Error('Unknown form control intent');
	}

	return control;
}

export function serializeIntent<Schema>(intent: Intent<Schema>): string {
	switch (intent.type) {
		case 'insert':
			return JSON.stringify({
				type: intent.type,
				payload: {
					...intent.payload,
					defaultValue: serialize(intent.payload.defaultValue),
				},
			});
		case 'update':
			return JSON.stringify({
				type: intent.type,
				payload: {
					...intent.payload,
					value: serialize(intent.payload.value),
				},
			});
		default:
			return JSON.stringify(intent);
	}
}

export function updateList(
	list: unknown,
	intent: InsertIntent | RemoveIntent | ReorderIntent,
): void {
	invariant(
		Array.isArray(list),
		`Failed to update list. The value is not an array.`,
	);

	switch (intent.type) {
		case 'insert':
			list.splice(
				intent.payload.index ?? list.length,
				0,
				intent.payload.defaultValue,
			);
			break;
		case 'remove':
			list.splice(intent.payload.index, 1);
			break;
		case 'reorder':
			list.splice(intent.payload.to, 0, ...list.splice(intent.payload.from, 1));
			break;
		default:
			throw new Error('Unknown list intent received');
	}
}

export function setListValue(
	data: Record<string, unknown>,
	intent: InsertIntent | RemoveIntent | ReorderIntent,
): void {
	setValueAtPath(data, intent.payload.name, (value: unknown) => {
		const list = value ?? [];

		updateList(list, intent);

		return list;
	});
}

/**
 * A placeholder symbol for the root value of a nested object
 */
export const root = Symbol.for('root');

export function setState(
	state: Record<string, unknown>,
	name: string,
	valueFn: (value: unknown) => unknown,
): void {
	// The keys are sorted in desc so that the root value is handled last
	const keys = Object.keys(state).sort((prev, next) =>
		next.localeCompare(prev),
	);
	const target: Record<string, unknown> = {};

	for (const key of keys) {
		const value = state[key];

		if (isPrefix(key, name) && key !== name) {
			setValueAtPath(target, key, (currentValue: unknown) => {
				if (typeof currentValue === 'undefined') {
					return value;
				}

				// As the key should be unique, if currentValue is already defined,
				// it must be either an object or an array

				// @ts-expect-error
				currentValue[root] = value;

				return currentValue;
			});

			// Remove the value from the data
			delete state[key];
		}
	}

	const result = valueFn(getValueAtPath(target, name));

	Object.assign(
		state,
		flatten(result, {
			resolve(data) {
				if (isPlainObject(data) || Array.isArray(data)) {
					// @ts-expect-error
					return data[root] ?? null;
				}

				return data;
			},
			prefix: name,
		}),
	);
}

export function setListState(
	state: Record<string, unknown>,
	intent: InsertIntent | RemoveIntent | ReorderIntent,
	getDefaultValue?: (defaultValue: any) => any,
): void {
	setState(state, intent.payload.name, (value) => {
		const list = value ?? [];

		switch (intent.type) {
			case 'insert':
				updateList(list, {
					type: intent.type,
					payload: {
						...intent.payload,
						defaultValue: getDefaultValue?.(intent.payload.defaultValue),
					},
				});
				break;
			default:
				updateList(list, intent);
				break;
		}

		return list;
	});
}

export function serialize<Schema>(defaultValue: Schema): FormValue<Schema> {
	if (isPlainObject(defaultValue)) {
		// @ts-expect-error FIXME
		return Object.entries(defaultValue).reduce<Record<string, unknown>>(
			(result, [key, value]) => {
				result[key] = serialize(value);
				return result;
			},
			{},
		);
	} else if (Array.isArray(defaultValue)) {
		// @ts-expect-error FIXME
		return defaultValue.map(serialize);
	} else if (defaultValue instanceof Date) {
		// @ts-expect-error FIXME
		return defaultValue.toISOString();
	} else if (typeof defaultValue === 'boolean') {
		// @ts-expect-error FIXME
		return defaultValue ? 'on' : undefined;
	} else if (
		typeof defaultValue === 'number' ||
		typeof defaultValue === 'bigint'
	) {
		// @ts-expect-error FIXME
		return defaultValue.toString();
	} else {
		// @ts-expect-error FIXME
		return defaultValue ?? undefined;
	}
}

/**
 * Normalize value by removing empty object or array, empty string and null values
 */
export function normalize<Type extends Record<string, unknown>>(
	value: Type,
	acceptFile?: boolean,
): Type | undefined;
export function normalize<Type extends Array<unknown>>(
	value: Type,
	acceptFile?: boolean,
): Type | undefined;
export function normalize(
	value: unknown,
	acceptFile?: boolean,
): unknown | undefined;
export function normalize<
	Type extends Record<string, unknown> | Array<unknown>,
>(
	value: Type,
	acceptFile = true,
): Record<string, unknown> | Array<unknown> | undefined {
	if (isPlainObject(value)) {
		const obj = Object.keys(value)
			.sort()
			.reduce<Record<string, unknown>>((result, key) => {
				const data = normalize(value[key], acceptFile);

				if (typeof data !== 'undefined') {
					result[key] = data;
				}

				return result;
			}, {});

		if (Object.keys(obj).length === 0) {
			return;
		}

		return obj;
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return undefined;
		}

		return value.map((item) => normalize(item, acceptFile));
	}

	if (
		(typeof value === 'string' && value === '') ||
		value === null ||
		(isGlobalInstance(value, 'File') && (!acceptFile || value.size === 0))
	) {
		return;
	}

	return value;
}

/**
 * Flatten a tree into a dictionary
 */
export function flatten(
	data: unknown,
	options: {
		resolve?: (data: unknown) => unknown;
		prefix?: string;
	} = {},
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const resolve = options.resolve ?? ((data) => data);

	function process(data: unknown, prefix: string) {
		const value = normalize(resolve(data));

		if (typeof value !== 'undefined') {
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
