import type { FormValue } from './form';
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
	intent: string | null;
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
	intent?: string | null;
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
		intent,
		state: state ? JSON.parse(state) : { validated: {} },
		fields,
	};
}

export function parse<Value>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: string,
		) => { value?: Value; error?: Record<string, string[]> };
	},
): Submission<Value>;
export function parse<Value>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: string,
		) => Promise<{ value?: Value; error?: Record<string, string[]> }>;
	},
): Promise<Submission<Value>>;
export function parse<Value>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			intent: string,
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
			intent: string,
		) =>
			| { value?: Value; error?: Record<string, string[]> }
			| Promise<{ value?: Value; error?: Record<string, string[]> }>;
	},
): Submission<Value> | Promise<Submission<Value>> {
	const context = getSubmissionContext(payload);

	if (context.intent) {
		handleIntent(context.intent, (intent) => {
			switch (intent.type) {
				case 'validate':
					context.state.validated[intent.payload] = true;
					break;
				case 'reset': {
					if (intent.payload.name !== '') {
						setValue(context.payload, intent.payload.name, () => undefined);

						for (const key of Object.keys(context.state.validated)) {
							if (isPrefix(key, intent.payload.name)) {
								delete context.state.validated[key];
							}
						}
					} else {
						context.payload = {};
						context.state.validated = {};
					}
					break;
				}
				case 'list': {
					const list = setValue(
						context.payload,
						intent.payload.name,
						(currentValue) => {
							if (
								typeof currentValue !== 'undefined' &&
								!Array.isArray(currentValue)
							) {
								throw new Error(
									'The list intent can only be applied to a list',
								);
							}

							return currentValue ?? [];
						},
					);

					updateList(list, intent.payload);

					switch (intent.payload.operation) {
						case 'append':
						case 'prepend':
						case 'insert':
						case 'replace':
							updateState(context.state.validated, {
								...intent.payload,
								defaultValue: undefined,
							});
							break;
						default:
							updateState(context.state.validated, intent.payload);
							break;
					}

					context.state.validated[intent.payload.name] = true;
					break;
				}
			}
		});
	}

	const result = options.resolve(context.payload, context.intent ?? 'submit');
	const mergeResolveResult = (resolved: {
		error?: Record<string, string[]>;
		value?: Value;
	}): Submission<Value> => {
		const error = resolved.error ?? {};

		if (!context.intent) {
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
	if (context.intent !== null) {
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
		status: context.intent === null ? 'error' : 'updated',
		intent: context.intent,
		initialValue: simplify(context.payload) ?? {},
		error: simplify(error) as Record<string, string[]>,
		state: context.state,
	};
}

export type Intent =
	| {
			type: 'validate';
			payload: string;
	  }
	| {
			type: 'list';
			payload: ListIntentPayload;
	  }
	| {
			type: 'reset';
			payload: {
				name: string;
			};
	  };

export type ListIntentPayload<Schema = unknown> =
	| { name: string; operation: 'insert'; defaultValue?: Schema; index?: number }
	| { name: string; operation: 'prepend'; defaultValue?: FormValue<Schema> }
	| { name: string; operation: 'append'; defaultValue?: FormValue<Schema> }
	| {
			name: string;
			operation: 'replace';
			defaultValue: FormValue<Schema>;
			index: number;
	  }
	| { name: string; operation: 'remove'; index: number }
	| { name: string; operation: 'reorder'; from: number; to: number };

export function handleIntent<Result>(
	intent: string,
	handler: (intent: Intent) => Result,
): Result {
	const seperatorIndex = intent.indexOf('/');

	if (seperatorIndex > -1) {
		const type = intent.slice(0, seperatorIndex);
		const payload = intent.slice(seperatorIndex + 1);

		switch (type) {
			case 'validate':
				return handler({ type, payload });
			case 'reset':
			case 'list':
				return handler({ type, payload: JSON.parse(payload) });
		}
	}

	throw new Error('Unknown intent');
}

export function serializeIntent(intent: Intent): string {
	switch (intent.type) {
		case 'validate':
			return `${intent.type}/${intent.payload}`;
		case 'reset':
		case 'list':
			return `${intent.type}/${JSON.stringify(intent.payload)}`;
	}
}

export function requestIntent(
	form: HTMLFormElement | null | undefined,
	value: string,
): void {
	const submitter = document.createElement('button');

	submitter.name = INTENT;
	submitter.value = value;
	submitter.hidden = true;
	submitter.formNoValidate = true;

	requestSubmit(form, submitter);
}

export function updateList<Schema>(
	list: Array<FormValue<Schema>>,
	payload: ListIntentPayload<Schema>,
): void {
	switch (payload.operation) {
		case 'prepend':
			list.unshift(payload.defaultValue as any);
			break;
		case 'append':
			list.push(payload.defaultValue as any);
			break;
		case 'insert':
			list.splice(payload.index ?? list.length, 0, payload.defaultValue as any);
			break;
		case 'replace':
			list.splice(payload.index, 1, payload.defaultValue);
			break;
		case 'remove':
			list.splice(payload.index, 1);
			break;
		case 'reorder':
			list.splice(payload.to, 0, ...list.splice(payload.from, 1));
			break;
		default:
			throw new Error('Unknown list intent received');
	}
}

export function updateState<Schema>(
	data: Record<string, unknown>,
	payload: ListIntentPayload<Schema>,
): void {
	const root = Symbol.for('root');

	// The keys are sorted in desc so that the root value is handled last
	const keys = Object.keys(data).sort((prev, next) => next.localeCompare(prev));
	const target: Record<string, unknown> = {};

	for (const key of keys) {
		const value = data[key];

		if (key.startsWith(payload.name) && key !== payload.name) {
			setValue(target, key, (prev) => {
				if (typeof prev === 'undefined') {
					return value;
				}

				// @ts-expect-error As key is unique, if prev is already defined, it must be either an object or an array
				prev[root] = value;

				return prev;
			});

			// Remove the value from the data
			delete data[key];
		}
	}

	const value = setValue(target, payload.name, (value) => value ?? []);

	if (!Array.isArray(value)) {
		throw new Error('The name provided is not pointed to a list');
	}

	updateList(value, payload);

	Object.assign(
		data,
		flatten(value, {
			resolve(data) {
				if (Array.isArray(data)) {
					return null;
				}

				if (isPlainObject(data)) {
					return data[root] ?? null;
				}

				return data;
			},
			prefix: payload.name,
		}),
	);
}
