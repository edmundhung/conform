import type { DefaultValue, FieldName, FormValue } from './form';
import { requestSubmit } from './dom';
import {
	simplify,
	flatten,
	isPlainObject,
	setValue,
	isPrefix,
	getValue,
} from './formdata';
import { invariant } from './util';

export type SubmissionState = {
	validated: Record<string, boolean>;
};

export type SubmissionContext<Value = null, Error = unknown> = {
	intent: Intent | null;
	payload: Record<string, unknown>;
	fields: string[];
	value?: Value;
	error?: Record<string, Error | null> | null;
	state: SubmissionState;
};

export type Submission<Schema, Error = unknown, Value = Schema> =
	| {
			status: 'success';
			payload: Record<string, unknown>;
			value: Value;
			reply(options?: ReplyOptions<Error>): SubmissionResult<Error>;
	  }
	| {
			status: 'error' | undefined;
			payload: Record<string, unknown>;
			error: Record<string, Error | null> | null;
			reply(options?: ReplyOptions<Error>): SubmissionResult<Error>;
	  };

export type SubmissionResult<Error = unknown> = {
	status?: 'error' | 'success';
	intent?: Intent;
	initialValue?: Record<string, unknown> | null;
	error?: Record<string, Error | null>;
	state?: SubmissionState;
};

export type ReplyOptions<Error> =
	| {
			resetForm?: boolean;
	  }
	| {
			formErrors?: Error;
			fieldErrors?: Record<string, Error>;
			hideFields?: string[];
	  };

/**
 * The name to be used when submitting an intent
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
	const payload: Record<string, unknown> = {};
	const fields: string[] = [];

	invariant(
		(typeof intent === 'string' || intent === null) &&
			(typeof state === 'string' || state === null),
		`The input name "${INTENT}" and "${STATE}" are reserved by Conform. Please use another name for your input.`,
	);

	for (const [name, next] of body.entries()) {
		if (name === INTENT || name === STATE) {
			continue;
		}

		fields.push(name);
		setValue(payload, name, (prev) => {
			if (!prev) {
				return next;
			} else if (Array.isArray(prev)) {
				return prev.concat(next);
			} else {
				return [prev, next];
			}
		});
	}

	return {
		payload,
		intent: getIntent(intent),
		state: state ? JSON.parse(state) : { validated: {} },
		fields,
	};
}

export function parse<Value, Error>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: Intent | null,
		) => { value?: Value; error?: Record<string, Error | null> | null };
	},
): Submission<Value, Error>;
export function parse<Value, Error>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: Intent | null,
		) => Promise<{
			value?: Value;
			error?: Record<string, Error | null> | null;
		}>;
	},
): Promise<Submission<Value, Error>>;
export function parse<Value, Error>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: Intent | null,
		) =>
			| { value?: Value; error?: Record<string, Error | null> | null }
			| Promise<{ value?: Value; error?: Record<string, Error | null> | null }>;
	},
): Submission<Value, Error> | Promise<Submission<Value, Error>>;
export function parse<Value, Error>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: Intent | null,
		) =>
			| { value?: Value; error?: Record<string, Error | null> | null }
			| Promise<{ value?: Value; error?: Record<string, Error | null> | null }>;
	},
): Submission<Value, Error> | Promise<Submission<Value, Error>> {
	const context = getSubmissionContext(payload);
	const intent = context.intent;

	if (intent) {
		switch (intent.type) {
			case 'validate':
				context.state.validated[intent.payload] = true;
				break;
			case 'replace': {
				const { name, value, validated } = intent.payload;

				if (name) {
					setValue(context.payload, name, () => value);
				} else {
					// @ts-expect-error FIXME - it must be an object if there is no name
					context.payload = value;
				}

				if (validated) {
					if (isPlainObject(value) || Array.isArray(value)) {
						// Clean up previous validated state
						setState(context.state.validated, name, () => undefined);
						Object.assign(
							context.state.validated,
							flatten(value, {
								resolve() {
									return true;
								},
								prefix: name,
							}),
						);
					}

					context.state.validated[name] = true;
				} else {
					if (isPlainObject(value) || Array.isArray(value)) {
						setState(context.state.validated, name, () => undefined);
					}

					delete context.state.validated[name];
				}
				break;
			}
			case 'reset': {
				const { name, value, validated } = intent.payload;

				if (typeof value === 'undefined' || value) {
					if (name) {
						setValue(context.payload, name, () => undefined);
					} else {
						context.payload = {};
					}
				}

				if (typeof validated === 'undefined' || validated) {
					if (name) {
						setState(context.state.validated, name, () => undefined);
						delete context.state.validated[name];
					} else {
						context.state.validated = {};
					}
				}
				break;
			}
			case 'insert':
			case 'remove':
			case 'reorder': {
				setListValue(context.payload, intent);
				setListState(context.state.validated, intent);

				context.state.validated[intent.payload.name] = true;
				break;
			}
		}
	}

	const result = options.resolve(context.payload, intent);
	const mergeResolveResult = (resolved: {
		error?: Record<string, Error | null> | null;
		value?: Value;
	}) => {
		const error = typeof resolved.error !== 'undefined' ? resolved.error : {};

		if (!intent) {
			for (const name of [...context.fields, ...Object.keys(error ?? {})]) {
				context.state.validated[name] = true;
			}
		}

		return createSubmission({
			...context,
			value: resolved.value,
			error: resolved.error,
		});
	};

	if (result instanceof Promise) {
		return result.then(mergeResolveResult);
	}

	return mergeResolveResult(result);
}

export function createSubmission<Value, Error>(
	context: SubmissionContext<Value, Error>,
): Submission<Value, Error> {
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

export function replySubmission<Error>(
	context: SubmissionContext<unknown, Error>,
	options: ReplyOptions<Error> = {},
): SubmissionResult<Error> {
	switch (context.intent?.type) {
		case 'reset': {
			const name = context.intent.payload.name ?? '';

			if (name === '') {
				return {
					initialValue: null,
				};
			}
		}
	}

	if ('resetForm' in options && options.resetForm) {
		return { initialValue: null };
	}

	if ('hideFields' in options && options.hideFields) {
		for (const name of options.hideFields) {
			const value = getValue(context.payload, name);

			if (typeof value !== 'undefined') {
				setValue(context.payload, name, () => undefined);
			}
		}
	}

	const submissionError = Object.entries(context.error ?? {}).reduce<
		Record<string, Error | null>
	>((result, [name, error]) => {
		if (context.state.validated[name]) {
			result[name] = error;
		}

		return result;
	}, {});
	const extraError =
		'formErrors' in options || 'fieldErrors' in options
			? simplify({
					'': options.formErrors,
					...options.fieldErrors,
			  })
			: null;
	const error = simplify({
		...submissionError,
		...extraError,
	});

	return {
		status: context.intent ? undefined : error ? 'error' : 'success',
		intent: context.intent ? context.intent : undefined,
		initialValue: simplify(context.payload) ?? {},
		error,
		state: context.state,
	};
}

export type ValidateIntent<Schema = any> = {
	type: 'validate';
	payload: FieldName<Schema>;
};

export type ResetIntent<Schema = any> = {
	type: 'reset';
	payload: {
		name?: FieldName<Schema>;
		value?: boolean;
		validated?: boolean;
	};
};

export type ReplaceIntent<Schema = unknown> = {
	type: 'replace';
	payload: {
		name: FieldName<Schema>;
		value: NonNullable<DefaultValue<Schema>>;
		validated?: boolean;
	};
};

export type RemoveIntent<Schema extends Array<any> = any> = {
	type: 'remove';
	payload: {
		name: FieldName<Schema>;
		index: number;
	};
};

export type InsertIntent<Schema extends Array<any> = any> = {
	type: 'insert';
	payload: {
		name: FieldName<Schema>;
		defaultValue?: Schema extends Array<infer Item>
			? DefaultValue<Item>
			: never;
		index?: number;
	};
};

export type ReorderIntent<Schema extends Array<any> = any> = {
	type: 'reorder';
	payload: {
		name: FieldName<Schema>;
		from: number;
		to: number;
	};
};

export type Intent<Schema = unknown> =
	| ValidateIntent<Schema>
	| ResetIntent<Schema>
	| ReplaceIntent<Schema>
	| ReorderIntent<Schema extends Array<any> ? Schema : any>
	| RemoveIntent<Schema extends Array<any> ? Schema : any>
	| InsertIntent<Schema extends Array<any> ? Schema : any>;

export function getIntent(
	serializedIntent: string | null | undefined,
): Intent | null {
	if (!serializedIntent) {
		return null;
	}

	const intent = JSON.parse(serializedIntent);

	if (
		typeof intent.type !== 'string' ||
		typeof intent.payload === 'undefined'
	) {
		throw new Error('Unknown intent');
	}

	return intent;
}

export function serializeIntent(intent: Intent): string {
	return JSON.stringify(intent);
}

export function requestIntent(formId: string, intent: Intent): void {
	const form = document.forms.namedItem(formId);
	const submitter = document.createElement('button');

	submitter.name = INTENT;
	submitter.value = serializeIntent(intent);
	submitter.hidden = true;
	submitter.formNoValidate = true;

	form?.appendChild(submitter);
	requestSubmit(form, submitter);
	form?.removeChild(submitter);
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
				serialize(intent.payload.defaultValue),
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
	setValue(data, intent.payload.name, (value) => {
		const list = value ?? [];

		updateList(list, intent);

		return list;
	});
}

export function setState(
	state: Record<string, unknown>,
	name: string,
	valueFn: (value: unknown) => unknown,
): void {
	const root = Symbol.for('root');

	// The keys are sorted in desc so that the root value is handled last
	const keys = Object.keys(state).sort((prev, next) =>
		next.localeCompare(prev),
	);
	const target: Record<string, unknown> = {};

	for (const key of keys) {
		const value = state[key];

		if (isPrefix(key, name) && key !== name) {
			setValue(target, key, (currentValue) => {
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

	const result = valueFn(getValue(target, name));

	Object.assign(
		state,
		// @ts-expect-error FIXME flatten should be more flexible
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
	getDefaultValue?: () => string,
): void {
	setState(state, intent.payload.name, (value) => {
		const list = value ?? [];

		switch (intent.type) {
			case 'insert':
				updateList(list, {
					type: intent.type,
					payload: {
						...intent.payload,
						defaultValue: getDefaultValue?.(),
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

export function serialize<Schema>(
	defaultValue: DefaultValue<Schema>,
): FormValue<Schema> {
	if (isPlainObject(defaultValue)) {
		// @ts-expect-error FIXME
		return Object.entries(defaultValue).reduce<Record<string, unknown>>(
			(result, [key, value]) => {
				// @ts-ignore-error FIXME
				result[key] = serialize(value);
				return result;
			},
			{},
		);
	} else if (Array.isArray(defaultValue)) {
		// @ts-expect-error FIXME
		return defaultValue.map(serialize);
	} else if (
		// @ts-ignore-error FIXME
		defaultValue instanceof Date
	) {
		// @ts-expect-error FIXME
		return defaultValue.toISOString();
	} else if (typeof defaultValue === 'boolean') {
		// @ts-expect-error FIXME
		return defaultValue ? 'on' : undefined;
	} else if (typeof defaultValue === 'number') {
		// @ts-expect-error FIXME
		return defaultValue.toString();
	} else {
		// @ts-expect-error FIXME
		return defaultValue ?? undefined;
	}
}

export const intent = new Proxy(
	{} as {
		[Type in Intent['type']]: {} extends Extract<
			Intent,
			{ type: Type }
		>['payload']
			? <Schema>(
					payload?: Extract<Intent<Schema>, { type: Type }>['payload'],
			  ) => Extract<Intent<Schema>, { type: Type }>
			: <Schema>(
					payload: Extract<Intent<Schema>, { type: Type }>['payload'],
			  ) => Extract<Intent<Schema>, { type: Type }>;
	},
	{
		get(_, type) {
			return (payload = {}) => ({ type, payload });
		},
	},
);
