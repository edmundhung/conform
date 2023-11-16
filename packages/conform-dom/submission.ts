import { type FormValue } from './form';
import { requestSubmit } from './dom';
import { simplify, flatten, isPlainObject, setValue } from './formdata';
import { invariant } from './util';

export type SubmissionState = {
	key: Record<string, string>;
	validated: Record<string, boolean>;
};

export type SubmissionContext<Value> = {
	intent: string | null;
	initialValue: Record<string, unknown>;
	value: Value | null;
	error: Record<string, string[]>;
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
	initialValue?: Record<string, unknown>;
	error?: Record<string, string[]>;
	state?: SubmissionState;
};

export type ResolveResult = {
	intent: string | null;
	state: SubmissionState;
	data: Record<string, unknown>;
	fields: string[];
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

export function resolve(payload: FormData | URLSearchParams): ResolveResult {
	const intent = payload.get(INTENT);
	const state = payload.get(STATE);
	const data: Record<string, unknown> = {};
	const fields: string[] = [];

	invariant(
		(typeof intent === 'string' || intent === null) &&
			(typeof state === 'string' || state === null),
		`The input name "${INTENT}" and "${STATE}" are reserved by Conform. Please use another name for your input.`,
	);

	for (const [name, next] of payload.entries()) {
		if (name === INTENT || name === STATE) {
			continue;
		}

		fields.push(name);
		setValue(data, name, (prev) => {
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
		data,
		intent,
		state: state ? JSON.parse(state) : { key: {}, validated: {} },
		fields,
	};
}

export function getIntentHandler(
	form: ResolveResult,
	intents: Array<Intent> = [validate, list],
): (result: Omit<Required<SubmissionResult>, 'status'>) => void {
	if (form.intent) {
		for (const intent of intents) {
			const payload = intent.deserialize(form.intent);

			if (payload) {
				return intent.createHandler(form.data, payload);
			}
		}

		throw new Error(`Unknown intent: ${form.intent}`);
	}

	return (result) => {
		for (const name of [...form.fields, ...Object.keys(result.error)]) {
			form.state.validated[name] = true;
		}
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
	const form = resolve(payload);
	const update = getIntentHandler(form);
	const result = options.resolve(form.data, form.intent ?? 'submit');
	const mergeResolveResult = (resolved: {
		error?: Record<string, string[]>;
		value?: Value;
	}): Submission<Value> => {
		const error = resolved.error ?? {};
		const initialValue = form.data;
		const state = form.state;

		update({
			initialValue,
			error,
			state,
		});

		return createSubmission({
			intent: form.intent,
			initialValue,
			value: resolved.value ?? null,
			error,
			state,
		});
	};

	if (result instanceof Promise) {
		return result.then(mergeResolveResult);
	}

	return mergeResolveResult(result);
}

export function createSubmission<Value>(
	context: SubmissionContext<Value>,
): Submission<Value> {
	if (context.intent !== null) {
		return {
			type: 'update',
			payload: context.initialValue,
			value: null,
			error: context.error,
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
		payload: context.initialValue,
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
	context: SubmissionContext<unknown>,
	options?: AcceptOptions,
): SubmissionResult {
	if (options?.resetForm) {
		return { status: 'success' };
	}

	return {
		status: 'success',
		initialValue: simplify(context.initialValue) ?? {},
		error: simplify(context.error) as Record<string, string[]>,
		state: context.state,
	};
}

export function rejectSubmission(
	context: SubmissionContext<unknown>,
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
		initialValue: simplify(context.initialValue) ?? {},
		error: simplify(error) as Record<string, string[]>,
		state: context.state,
	};
}

export type Intent<Payload = unknown> = {
	type: string;
	serialize(payload: Payload): string;
	deserialize(serializedIntent: string): Payload | null;
	createHandler(
		data: Record<string, unknown>,
		payload: Payload,
	): (result: Omit<Required<SubmissionResult>, 'status'>) => void;
};

export function createIntent(options: {
	type: string;
	update: (
		result: Omit<Required<SubmissionResult>, 'status'>,
		payload: string,
	) => void;
}): Intent<string>;
export function createIntent<Payload>(options: {
	type: string;
	serialize: (payload: Payload) => string;
	deserialize: (serializedPayload: string) => Payload;
	update: (
		result: Omit<Required<SubmissionResult>, 'status'>,
		payload: Payload,
	) => void;
}): Intent<Payload>;
export function createIntent<Payload, Context>(options: {
	type: string;
	serialize: (payload: Payload) => string;
	deserialize: (serializedPayload: string) => Payload;
	preprocess: (data: Record<string, unknown>, payload: Payload) => Context;
	update: (
		result: Omit<Required<SubmissionResult>, 'status'>,
		payload: Payload,
		context: Context,
	) => void;
}): Intent<Payload>;
export function createIntent<Payload, Context>(options: {
	type: string;
	serialize?: (payload: Payload) => string;
	deserialize?: (serializedPayload: string) => Payload;
	preprocess?: (data: Record<string, unknown>, payload: Payload) => Context;
	update: (
		result: Omit<Required<SubmissionResult>, 'status'>,
		payload: Payload,
		context: Context | undefined,
	) => void;
}): Intent<Payload> {
	return {
		type: options.type,
		serialize(payload) {
			return `${options.type}/${options.serialize?.(payload) ?? payload}`;
		},
		deserialize(serializedIntent) {
			const seperatorIndex = serializedIntent.indexOf('/');

			if (seperatorIndex > -1) {
				const type = serializedIntent.slice(0, seperatorIndex);
				const serializedPayload = serializedIntent.slice(seperatorIndex + 1);

				if (type === options.type) {
					return (
						options.deserialize?.(serializedPayload) ??
						(serializedPayload as Payload)
					);
				}
			}

			return null;
		},
		createHandler(data, payload) {
			const context = options.preprocess?.(data, payload);

			return (result) => {
				options.update(result, payload, context);
			};
		},
	};
}

export const validate = createIntent({
	type: 'validate',
	update(result, payload) {
		result.state.validated[payload] = true;
	},
});

export const list = createIntent<ListIntentPayload, void>({
	type: 'list',
	serialize(payload) {
		return JSON.stringify(payload);
	},
	deserialize(serializedPayload) {
		return JSON.parse(serializedPayload);
	},
	preprocess(data, payload) {
		const list = setValue(data, payload.name, (currentValue) => {
			if (typeof currentValue !== 'undefined' && !Array.isArray(currentValue)) {
				throw new Error('The list intent can only be applied to a list');
			}

			return currentValue ?? [];
		});

		updateList(list, payload);
	},
	update(result, payload) {
		switch (payload.operation) {
			case 'append':
			case 'prepend':
			case 'insert':
			case 'replace':
				updateState(result.state.validated, {
					...payload,
					defaultValue: undefined,
				});
				updateState(result.state.key, {
					...payload,
					defaultValue: (Date.now() * Math.random()).toString(36),
				});
				break;
			default:
				updateState(result.state.validated, payload);
				updateState(result.state.key, payload);
				break;
		}

		result.state.validated[payload.name] = true;
	},
});

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
