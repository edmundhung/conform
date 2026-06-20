import type {
	FormValue,
	Submission,
	SubmissionResult,
} from '@conform-to/dom/future';
import {
	parsePath,
	getPathValue,
	isPlainObject,
	appendPath,
	getRelativePath,
} from '@conform-to/dom/future';
import {
	getPathArray,
	isUndefined,
	isOptional,
	isNumber,
	isString,
	updatePathValue,
	transformKeys,
	isNullable,
	updatePathIndex,
} from './util';
import type {
	FormIntent,
	IntentHandler,
	NormalizeIntentType,
	UnknownIntent,
	TransportIntent,
	ResetIntent,
	SubmitIntent,
	ValidateIntent,
	UpdateIntent,
	InsertIntent,
	RemoveIntent,
	ReorderIntent,
	DefaultIntentHandlers,
} from './types';

export function defineIntent<Definition = () => void, Payload = never>(
	definition?: Partial<IntentHandler<NormalizeIntentType<Definition>, Payload>>,
): IntentHandler<NormalizeIntentType<Definition>, Payload> {
	return {
		...definition,
		parse:
			definition?.parse ??
			((...args) => {
				if (args.length > 1) {
					throw new Error('Invalid intent arguments');
				}

				return args[0];
			}),
	};
}

export function mergeIntentHandlers<
	DefaultHandlers extends Record<string, IntentHandler<any, any>>,
	CustomHandlers extends Record<string, IntentHandler<any, any>> | undefined,
>(
	defaultHandlers: DefaultHandlers,
	customHandlers: CustomHandlers,
): DefaultHandlers & CustomHandlers {
	return {
		...defaultHandlers,
		...customHandlers,
	};
}

const undefinedArg = '__undefined__';

/**
 * Serializes a transport intent to string format.
 */
export function serializeIntent(intent: TransportIntent): string {
	if (intent.args.length === 0) {
		return intent.type;
	}

	return `${intent.type}(${JSON.stringify(intent.args, (_, value) =>
		value === undefined ? undefinedArg : value,
	).slice(1, -1)})`;
}

/**
 * Parses the serialized intent string into a transport intent.
 */
export function deserializeIntent(
	serializedIntent: string,
): TransportIntent | undefined {
	if (serializedIntent === '') {
		return undefined;
	}

	let type = serializedIntent;
	let args: Array<unknown> = [];

	const openParenIndex = serializedIntent.indexOf('(');

	if (
		openParenIndex > 0 &&
		serializedIntent[serializedIntent.length - 1] === ')'
	) {
		type = serializedIntent.slice(0, openParenIndex);

		const serializedArgs = serializedIntent.slice(openParenIndex + 1, -1);

		if (serializedArgs !== '') {
			try {
				args = JSON.parse(`[${serializedArgs}]`, (_, value) =>
					value === undefinedArg ? undefined : value,
				);
			} catch {
				return undefined;
			}
		}
	}

	return {
		type,
		args,
	};
}

export function parseIntent<
	Handlers extends Record<string, IntentHandler<any, any>>,
>(
	intentValue: string | null,
	options: {
		handlers: Handlers;
	},
):
	| FormIntent<Record<string, any>, Handlers>
	| { type: 'submit'; payload: undefined }
	| undefined {
	if (intentValue === null) {
		return { type: 'submit', payload: undefined };
	}

	const transportIntent = deserializeIntent(intentValue);

	if (!transportIntent) {
		return undefined;
	}

	const handler = options.handlers[transportIntent.type];

	if (!handler) {
		return undefined;
	}

	try {
		return {
			type: transportIntent.type,
			payload: handler.parse(...transportIntent.args),
		} as any;
	} catch {
		return undefined;
	}
}

export function resolveIntent(
	submission: Submission,
	options: {
		handlers: Record<string, IntentHandler<any, any>>;
		intent: UnknownIntent | undefined;
	},
): Record<string, FormValue> | undefined {
	const handlers = options.handlers;
	const intent = options.intent;
	const handler = intent ? handlers[intent.type] : null;

	if (!intent || !handler?.resolve) {
		return submission.payload;
	}

	return handler.resolve({
		value: submission.payload,
		payload: intent.payload,
	});
}

export function applyIntent<ErrorShape>(
	result: SubmissionResult<ErrorShape>,
	intent: UnknownIntent | undefined,
	options: {
		handlers: Record<string, IntentHandler<any, any>>;
	},
): SubmissionResult<ErrorShape> {
	if (intent) {
		const handler = options.handlers[intent.type];

		if (handler?.apply) {
			return handler.apply({
				result,
				payload: intent.payload,
			});
		}
	}

	return result;
}

export function insertItem<Item>(
	list: Array<Item>,
	item: Item,
	index: number,
): void {
	list.splice(index, 0, item);
}

export function removeItem(list: Array<unknown>, index: number): void {
	list.splice(index, 1);
}

export function reorderItems(
	list: Array<unknown>,
	fromIndex: number,
	toIndex: number,
): void {
	list.splice(toIndex, 0, ...list.splice(fromIndex, 1));
}

/**
 * Updates list keys by removing child keys and optionally transforming remaining keys.
 */
export function updateListKeys(
	keys: Record<string, string[]> = {},
	keyToBeRemoved: string,
	updateKey?: (key: string) => string | null,
): Record<string, string[]> {
	const basePath = parsePath(keyToBeRemoved);
	return transformKeys(keys, (field) =>
		getRelativePath(field, basePath) !== null
			? null
			: (updateKey?.(field) ?? field),
	);
}

export const submit = defineIntent<SubmitIntent>({
	touch() {
		return true;
	},
});

export const reset = defineIntent<ResetIntent>({
	parse(options) {
		if (
			!isOptional(options, isPlainObject) ||
			(!isUndefined(options?.defaultValue) &&
				!isNullable(options?.defaultValue, isPlainObject))
		) {
			throw new Error('Invalid reset intent arguments');
		}

		return options;
	},
	resolve({ payload }) {
		if (payload?.defaultValue === null) {
			return {};
		}

		return payload?.defaultValue;
	},
	apply({ result }) {
		return {
			...result,
			reset: true,
		};
	},
});

export const validate = defineIntent<ValidateIntent>({
	parse(name) {
		if (!isOptional(name, isString)) {
			throw new Error('Invalid validate intent arguments');
		}

		return name;
	},
	touch({ name, payload }) {
		return getRelativePath(name, payload ?? '') !== null;
	},
});

export const update = defineIntent<UpdateIntent>({
	parse(options) {
		if (
			!isPlainObject(options) ||
			!isOptional(options.name, isString) ||
			!isOptional(options.index, isNumber) ||
			isUndefined(options.value)
		) {
			throw new Error('Invalid update intent arguments');
		}

		return options;
	},
	resolve({ value, payload }) {
		const fieldName = appendPath(payload.name, payload.index);
		const nextValue = (payload.value ??
			(fieldName === '' ? {} : null)) as FormValue | null;

		return updatePathValue(value, fieldName, nextValue);
	},
	touch({ name, payload }) {
		const fieldName = appendPath(payload.name, payload.index);
		return getRelativePath(name, fieldName) !== null;
	},
});

export const insert = defineIntent<InsertIntent>({
	parse(options) {
		if (
			!isPlainObject(options) ||
			!isString(options.name) ||
			!isOptional(options.index, isNumber) ||
			!isOptional(options.from, isString) ||
			!isOptional(options.onInvalid, (mode) => mode === 'revert')
		) {
			throw new Error('Invalid insert intent arguments');
		}

		return options;
	},
	resolve({ value, payload }) {
		let result = value;
		let itemValue = payload.defaultValue;

		if (payload.from !== undefined) {
			itemValue = getPathValue(result, payload.from);
			result = updatePathValue(result, payload.from, '');
		}

		const list = Array.from(getPathArray(result, payload.name));
		insertItem(list, itemValue, payload.index ?? list.length);
		return updatePathValue(result, payload.name, list);
	},
	apply({ result, payload }) {
		// Warn if validation result is not yet available
		if (
			typeof result.error === 'undefined' &&
			(payload.onInvalid || payload.from)
		) {
			// eslint-disable-next-line no-console
			console.warn(
				'intent.insert() with `onInvalid` or `from` requires the validation result to be available synchronously. ' +
					'These options are ignored because the error is not yet known.',
			);
			return result;
		}

		const listError = result.error?.fieldErrors[payload.name];

		if (payload.onInvalid === 'revert' && listError != null) {
			return {
				...result,
				targetValue: undefined,
			};
		}

		if (payload.from !== undefined) {
			const index =
				payload.index ??
				getPathArray(result.submission.payload, payload.name).length;
			const insertedItemPath = appendPath(payload.name, index);
			const insertedItemError = result.error?.fieldErrors[insertedItemPath];
			const fromFieldError = result.error?.fieldErrors[payload.from];

			if (fromFieldError != null) {
				return {
					...result,
					targetValue: undefined,
					error: {
						formErrors: result.error?.formErrors ?? null,
						fieldErrors: {
							...result.error?.fieldErrors,
							[insertedItemPath]: null,
						},
					},
				};
			}

			if (insertedItemError != null) {
				return {
					...result,
					targetValue: undefined,
					error: {
						formErrors: result.error?.formErrors ?? null,
						fieldErrors: {
							...result.error?.fieldErrors,
							[payload.from]: insertedItemError,
							[insertedItemPath]: null,
						},
					},
				};
			}
		}

		return result;
	},
	touch({ name, payload }) {
		return name === payload.name || name === payload.from;
	},
	move({ name, payload, status }) {
		if (status !== 'applied' || typeof payload.index === 'undefined') {
			return name;
		}

		return updatePathIndex(name, payload.name, (currentIndex) =>
			payload.index !== undefined && payload.index <= currentIndex
				? currentIndex + 1
				: currentIndex,
		);
	},
});

export const remove = defineIntent<RemoveIntent>({
	parse(options) {
		if (
			!isPlainObject(options) ||
			!isString(options.name) ||
			!isNumber(options.index) ||
			!isOptional(options.onInvalid, (v) => v === 'revert' || v === 'insert')
		) {
			throw new Error('Invalid remove intent arguments');
		}

		return options;
	},
	resolve({ value, payload }) {
		const list = Array.from(getPathArray(value, payload.name));
		removeItem(list, payload.index);
		return updatePathValue(value, payload.name, list);
	},
	apply({ result, payload }) {
		// Warn if validation result is not yet available
		if (typeof result.error === 'undefined' && payload.onInvalid) {
			// eslint-disable-next-line no-console
			console.warn(
				'intent.remove() with `onInvalid` requires the validation result to be available synchronously. ' +
					'This option is ignored because the error is not yet known.',
			);
			return result;
		}

		if (result.targetValue && result.error?.fieldErrors[payload.name]) {
			switch (payload.onInvalid) {
				case 'revert':
					return {
						...result,
						targetValue: undefined,
					};
				case 'insert': {
					const list = Array.from(
						getPathArray(result.targetValue, payload.name),
					);
					insertItem(list, payload.defaultValue, list.length);
					return {
						...result,
						targetValue: updatePathValue(
							result.targetValue,
							payload.name,
							list,
						),
					};
				}
			}
		}

		return result;
	},
	touch({ name, payload }) {
		return name === payload.name;
	},
	move({ name, payload, status }) {
		if (status === 'reverted') {
			return name;
		}

		return updatePathIndex(name, payload.name, (currentIndex) => {
			if (payload.index === currentIndex) {
				return null;
			}

			return payload.index < currentIndex ? currentIndex - 1 : currentIndex;
		});
	},
});

export const reorder = defineIntent<ReorderIntent>({
	parse(options) {
		if (
			!isPlainObject(options) ||
			!isString(options.name) ||
			!isNumber(options.from) ||
			!isNumber(options.to)
		) {
			throw new Error('Invalid reorder intent arguments');
		}

		return options;
	},
	resolve({ value, payload }) {
		const list = Array.from(getPathArray(value, payload.name));
		reorderItems(list, payload.from, payload.to);
		return updatePathValue(value, payload.name, list);
	},
	touch({ name, payload }) {
		return name === payload.name;
	},
	move({ name, payload }) {
		return updatePathIndex(name, payload.name, (currentIndex) => {
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
		});
	},
});

/**
 * Default Intent handlers
 * - reset: clears form data
 * - validate: marks fields as touched for validation display
 * - update: updates specific field values
 * - insert/remove/reorder: manages array field operations
 */
export const defaultIntentHandlers: DefaultIntentHandlers = {
	submit,
	reset,
	validate,
	update,
	insert,
	remove,
	reorder,
};
