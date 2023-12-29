import type { DefaultValue, FieldName, FormValue } from './form';
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

export type SubmissionContext<Value = null, FormError = unknown> = {
	control: FormControl | null;
	payload: Record<string, unknown>;
	fields: string[];
	value?: Value;
	error?: Record<string, FormError | null> | null;
	state: SubmissionState;
};

export type Submission<Schema, FormError = string[], Value = Schema> =
	| {
			status: 'success';
			payload: Record<string, unknown>;
			value: Value;
			reply(options?: ReplyOptions<FormError>): SubmissionResult<FormError>;
	  }
	| {
			status: 'error' | undefined;
			payload: Record<string, unknown>;
			error: Record<string, FormError | null> | null;
			reply(options?: ReplyOptions<FormError>): SubmissionResult<FormError>;
	  };

export type SubmissionResult<FormError = string[]> = {
	status?: 'error' | 'success';
	control?: FormControl;
	initialValue?: Record<string, unknown> | null;
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
export const CONTROL = '__control__';

/**
 * The name to be used when submitting a state
 */
export const STATE = '__state__';

export function getSubmissionContext(
	body: FormData | URLSearchParams,
): SubmissionContext {
	const control = body.get(CONTROL);
	const state = body.get(STATE);
	const payload: Record<string, unknown> = {};
	const fields: string[] = [];

	invariant(
		(typeof control === 'string' || control === null) &&
			(typeof state === 'string' || state === null),
		`The input name "${CONTROL}" and "${STATE}" are reserved by Conform. Please use another name for your input.`,
	);

	for (const [name, next] of body.entries()) {
		if (name === CONTROL || name === STATE) {
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
		control: getControl(control),
		state: state ? JSON.parse(state) : { validated: {} },
		fields,
	};
}

export function parse<FormValue, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			control: FormControl | null,
		) => { value?: FormValue; error?: Record<string, FormError | null> | null };
	},
): Submission<FormValue, FormError>;
export function parse<FormValue, FormError>(
	payload: FormData | URLSearchParams,
	options: {
		resolve: (
			payload: Record<string, any>,
			control: FormControl | null,
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
			control: FormControl | null,
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
			control: FormControl | null,
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
	const control = context.control;

	if (control) {
		switch (control.type) {
			case 'validate':
				if (control.payload.name) {
					context.state.validated[control.payload.name] = true;
				}
				break;
			case 'replace': {
				const { name, value, validated } = control.payload;

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
				const { name, value, validated } = control.payload;

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
				setListValue(context.payload, control);
				setListState(context.state.validated, control);

				context.state.validated[control.payload.name] = true;
				break;
			}
		}
	}

	const result = options.resolve(context.payload, control);
	const mergeResolveResult = (resolved: {
		error?: Record<string, FormError | null> | null;
		value?: FormValue;
	}) => {
		const error = typeof resolved.error !== 'undefined' ? resolved.error : {};

		if (!control || (control.type === 'validate' && !control.payload.name)) {
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

export function createSubmission<FormValue, FormError>(
	context: SubmissionContext<FormValue, FormError>,
): Submission<FormValue, FormError> {
	if (context.control || !context.value || context.error) {
		return {
			status: !context.control ? 'error' : undefined,
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
	switch (context.control?.type) {
		case 'reset': {
			const name = context.control.payload.name ?? '';

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
		Record<string, FormError | null>
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
		status: context.control ? undefined : error ? 'error' : 'success',
		control: context.control ? context.control : undefined,
		initialValue: simplify(context.payload) ?? {},
		error,
		state: context.state,
	};
}

export type ValidateControl<Schema = any> = {
	type: 'validate';
	payload: {
		name?: FieldName<Schema>;
	};
};

export type ResetControl<Schema = any> = {
	type: 'reset';
	payload: {
		name?: FieldName<Schema>;
		value?: boolean;
		validated?: boolean;
	};
};

export type ReplaceControl<Schema = unknown> = {
	type: 'replace';
	payload: {
		name: FieldName<Schema>;
		value: NonNullable<DefaultValue<Schema>>;
		validated?: boolean;
	};
};

export type RemoveControl<Schema extends Array<any> = any> = {
	type: 'remove';
	payload: {
		name: FieldName<Schema>;
		index: number;
	};
};

export type InsertControl<Schema extends Array<any> = any> = {
	type: 'insert';
	payload: {
		name: FieldName<Schema>;
		defaultValue?: Schema extends Array<infer Item>
			? DefaultValue<Item>
			: never;
		index?: number;
	};
};

export type ReorderControl<Schema extends Array<any> = any> = {
	type: 'reorder';
	payload: {
		name: FieldName<Schema>;
		from: number;
		to: number;
	};
};

export type FormControl<Schema = unknown> =
	| ValidateControl<Schema>
	| ResetControl<Schema>
	| ReplaceControl<Schema>
	| ReorderControl<Schema extends Array<any> ? Schema : any>
	| RemoveControl<Schema extends Array<any> ? Schema : any>
	| InsertControl<Schema extends Array<any> ? Schema : any>;

export function getControl(
	serializedControl: string | null | undefined,
): FormControl | null {
	if (!serializedControl) {
		return null;
	}

	const control = JSON.parse(serializedControl);

	if (
		typeof control.type !== 'string' ||
		typeof control.payload === 'undefined'
	) {
		throw new Error('Unknown control');
	}

	return control;
}

export function serializeControl(control: FormControl): string {
	return JSON.stringify(control);
}

export function updateList(
	list: unknown,
	control: InsertControl | RemoveControl | ReorderControl,
): void {
	invariant(
		Array.isArray(list),
		`Failed to update list. The value is not an array.`,
	);

	switch (control.type) {
		case 'insert':
			list.splice(
				control.payload.index ?? list.length,
				0,
				serialize(control.payload.defaultValue),
			);
			break;
		case 'remove':
			list.splice(control.payload.index, 1);
			break;
		case 'reorder':
			list.splice(
				control.payload.to,
				0,
				...list.splice(control.payload.from, 1),
			);
			break;
		default:
			throw new Error('Unknown list control received');
	}
}

export function setListValue(
	data: Record<string, unknown>,
	control: InsertControl | RemoveControl | ReorderControl,
): void {
	setValue(data, control.payload.name, (value) => {
		const list = value ?? [];

		updateList(list, control);

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
	control: InsertControl | RemoveControl | ReorderControl,
	getDefaultValue?: () => string,
): void {
	setState(state, control.payload.name, (value) => {
		const list = value ?? [];

		switch (control.type) {
			case 'insert':
				updateList(list, {
					type: control.type,
					payload: {
						...control.payload,
						defaultValue: getDefaultValue?.(),
					},
				});
				break;
			default:
				updateList(list, control);
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

export const control = new Proxy(
	{} as {
		[Type in FormControl['type']]: {} extends Extract<
			FormControl,
			{ type: Type }
		>['payload']
			? <Schema>(
					payload?: Extract<FormControl<Schema>, { type: Type }>['payload'],
			  ) => Extract<FormControl<Schema>, { type: Type }>
			: <Schema>(
					payload: Extract<FormControl<Schema>, { type: Type }>['payload'],
			  ) => Extract<FormControl<Schema>, { type: Type }>;
	},
	{
		get(_, type) {
			return (payload = {}) => ({ type, payload });
		},
	},
);
