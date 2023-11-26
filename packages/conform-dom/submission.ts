import type { FieldName, FormValue } from './form';
import { requestSubmit } from './dom';
import {
	simplify,
	flatten,
	isPlainObject,
	setValue,
	isPrefix,
} from './formdata';
import { invariant } from './util';

export type SubmissionState = {
	validated: Record<string, boolean>;
};

export type SubmissionContext<Value> = {
	intents: Array<Intent> | null;
	payload: Record<string, unknown>;
	fields: string[];
	value?: Value | null;
	error?: Record<string, string[]>;
	state: SubmissionState;
};

export type Submission<Schema, Value = Schema> =
	| {
			type: 'submit';
			payload: Record<string, unknown>;
			value: Value | null;
			error: Record<string, string[]>;
			reject(options?: RejectOptions): SubmissionResult;
			accept(options?: AcceptOptions): SubmissionResult;
	  }
	| {
			type: 'update';
			payload: Record<string, unknown>;
			value: null;
			error: Record<string, string[]> | null;
			reject(options?: RejectOptions): SubmissionResult;
			accept(options?: AcceptOptions): SubmissionResult;
	  };

export type SubmissionResult = {
	status: 'updated' | 'error' | 'success';
	intents?: Array<Intent>;
	initialValue?: Record<string, unknown>;
	error?: Record<string, string[]>;
	state?: SubmissionState;
};

export type AcceptOptions = {
	resetForm?: boolean;
};

export type RejectOptions =
	| {
			formErrors: string[];
			fieldErrors?: Record<string, string[]>;
	  }
	| {
			formErrors?: string[];
			fieldErrors: Record<string, string[]>;
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
): SubmissionContext<unknown> {
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
		intents: getIntents(intent),
		state: state ? JSON.parse(state) : { validated: {} },
		fields,
	};
}

export function parse<Value>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intents: Array<Intent> | null,
		) => { value?: Value; error?: Record<string, string[]> };
	},
): Submission<Value>;
export function parse<Value>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intents: Array<Intent> | null,
		) => Promise<{ value?: Value; error?: Record<string, string[]> }>;
	},
): Promise<Submission<Value>>;
export function parse<Value>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intents: Array<Intent> | null,
		) =>
			| { value?: Value; error?: Record<string, string[]> }
			| Promise<{ value?: Value; error?: Record<string, string[]> }>;
	},
): Submission<Value> | Promise<Submission<Value>>;
export function parse<Value>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intents: Array<Intent> | null,
		) =>
			| { value?: Value; error?: Record<string, string[]> }
			| Promise<{ value?: Value; error?: Record<string, string[]> }>;
	},
): Submission<Value> | Promise<Submission<Value>> {
	const context = getSubmissionContext(payload);

	if (context.intents) {
		for (const intent of context.intents) {
			switch (intent.type) {
				case 'validate':
					context.state.validated[intent.payload] = true;
					break;
				case 'replace': {
					const { name = '', value, validated } = intent.payload;

					if (typeof value !== 'undefined') {
						if (name) {
							setValue(context.payload, name, () => value);
						} else {
							context.payload = value as any;
						}
					}

					if (validated) {
						context.state.validated[name] = true;
					} else {
						delete context.state.validated[name];
					}
					break;
				}
				case 'reset': {
					const { name, value = true, validated } = intent.payload;

					if (value) {
						if (name) {
							setValue(context.payload, name, () => undefined);
						} else {
							context.payload = {};
						}
					}

					if (!validated) {
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
	}

	const result = options.resolve(context.payload, context.intents);
	const mergeResolveResult = (resolved: {
		error?: Record<string, string[]>;
		value?: Value;
	}): Submission<Value> => {
		const error = resolved.error ?? {};

		if (!context.intents) {
			for (const name of [...context.fields, ...Object.keys(error)]) {
				context.state.validated[name] = true;
			}
		}

		return createSubmission({
			...context,
			value: resolved.value ?? null,
			error,
		});
	};

	if (result instanceof Promise) {
		return result.then(mergeResolveResult);
	}

	return mergeResolveResult(result);
}

export function createSubmission<Value>(
	context: Required<SubmissionContext<Value>>,
): Submission<Value> {
	if (context.intents) {
		return {
			type: 'update',
			payload: context.payload,
			value: null,
			error: context.error ?? {},
			accept(options) {
				return acceptSubmission(context, options);
			},
			reject(options) {
				return rejectSubmission(context, options);
			},
		};
	}

	return {
		type: 'submit',
		payload: context.payload,
		value: context.value,
		error: context.error,
		accept(options) {
			return acceptSubmission(context, options);
		},
		reject(options) {
			return rejectSubmission(context, options);
		},
	};
}

export function acceptSubmission(
	context: Required<SubmissionContext<unknown>>,
	options?: AcceptOptions,
): SubmissionResult {
	if (options?.resetForm) {
		return { status: 'success' };
	}

	return {
		status: 'success',
		initialValue: simplify(context.payload) ?? {},
		error: simplify(context.error) as Record<string, string[]>,
		state: context.state,
	};
}

export function rejectSubmission(
	context: Required<SubmissionContext<unknown>>,
	options?: RejectOptions,
): SubmissionResult {
	const error = Object.entries(context.error ?? {}).reduce<
		Record<string, string[]>
	>(
		(result, [name, messages]) => {
			if (messages.length > 0 && context.state.validated[name]) {
				result[name] = (result[name] ?? []).concat(messages);
			}

			return result;
		},
		{ '': options?.formErrors ?? [], ...options?.fieldErrors },
	);

	return {
		status: context.intents !== null ? 'updated' : 'error',
		intents: context.intents !== null ? context.intents : undefined,
		initialValue: simplify(context.payload) ?? {},
		error: simplify(error) as Record<string, string[]>,
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

export type ReplaceIntent<Schema = any> = {
	type: 'replace';
	payload: {
		name?: FieldName<Schema>;
		value?: FormValue<Schema>;
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
		defaultValue?: Schema extends Array<infer Item> ? FormValue<Item> : never;
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

export type Intent<Schema = any> =
	| ValidateIntent<Schema>
	| ResetIntent<Schema>
	| ReplaceIntent<Schema>
	| ReorderIntent<Schema extends Array<any> ? Schema : never>
	| RemoveIntent<Schema extends Array<any> ? Schema : never>
	| InsertIntent<Schema extends Array<any> ? Schema : never>;

export function getIntents(
	intent: string | null | undefined,
): Array<Intent> | null {
	if (!intent) {
		return null;
	}

	const intents = JSON.parse(intent);

	if (
		!Array.isArray(intents) ||
		intents.length === 0 ||
		!intents.every(
			(intent) =>
				typeof intent.type === 'string' &&
				typeof intent.payload !== 'undefined',
		)
	) {
		throw new Error('Unknown intent');
	}

	return intents;
}

export function serializeIntents(intents: Array<Intent>): string {
	return JSON.stringify(intents);
}

export function requestIntent(formId: string, intents: Array<Intent>): void {
	const form = document.forms.namedItem(formId);
	const submitter = document.createElement('button');

	submitter.name = INTENT;
	submitter.value = serializeIntents(intents);
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
				intent.payload.defaultValue as any,
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

	let result;

	setValue(target, name, (currentValue) => {
		result = valueFn(currentValue);

		return result;
	});

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
	getDefaultValue?: () => unknown,
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

export const intent = new Proxy(
	{} as {
		[Type in Intent['type']]: <Schema>(
			payload: Extract<Intent<Schema>, { type: Type }>['payload'],
		) => Extract<Intent<Schema>, { type: Type }>;
	},
	{
		get(_, type) {
			return (payload: any) => ({ type, payload });
		},
	},
);
