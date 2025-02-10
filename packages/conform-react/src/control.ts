import type {
	FormError,
	FormValue,
	Submission,
	SubmissionResult,
} from 'conform-dom';
import {
	isInput,
	getPaths,
	getValue,
	isPlainObject,
	setValue,
} from 'conform-dom';
import { serialize, getDefaultListKey } from './metadata';
import {
	addItems,
	configureListIndexUpdate,
	getName,
	getListValue,
	isNonNullable,
	isNumber,
	isOptionalNumber,
	isOptionalString,
	isString,
	mapItems,
	deepEqual,
	mapKeys,
	mergeObjects,
	mutate,
	insertItem,
	reorderItems,
	removeItem,
	updateFieldValue,
	getChildPaths,
} from './util';

export type DefaultValue<FormShape> = FormShape extends
	| string
	| number
	| boolean
	| Date
	| File
	| bigint
	| null
	| undefined
	? FormShape | null | undefined
	: FormShape extends Array<infer Item> | null | undefined
		? Array<DefaultValue<Item>> | null | undefined
		: FormShape extends Record<string, any> | null | undefined
			?
					| { [Key in keyof FormShape]?: DefaultValue<FormShape[Key]> }
					| null
					| undefined
			: unknown;

export type FormState<FormShape, ErrorShape> = {
	initialValue: Record<string, unknown> | null;
	submittedValue: Record<string, unknown> | null;
	serverError: FormError<FormShape, ErrorShape> | null;
	clientError: FormError<FormShape, ErrorShape> | null;
	touchedFields: string[];
	keys: Record<string, string[]>;
};

export function generateKey(): string {
	return Math.floor(Date.now() * Math.random()).toString(36);
}

export function updateKeys(
	keys: Record<string, string[]> = {},
	keyToBeRemoved: string,
	updateKey: (key: string) => string | null,
): Record<string, string[]> {
	return mapKeys(keys, (field) =>
		getChildPaths(keyToBeRemoved, field) !== null ? null : updateKey(field),
	);
}

export function modify<Data>(
	data: Record<string, Data>,
	name: string,
	value: Data | Record<string, Data>,
): Record<string, Data> {
	if (name === '') {
		if (!isPlainObject(value)) {
			throw new Error('The value must be an object');
		}

		return mergeObjects(data, value);
	}

	const paths = getPaths(name);
	const prevValue = getValue(data, paths);
	const nextValue =
		isPlainObject(prevValue) && isPlainObject(value)
			? mergeObjects(prevValue, value)
			: value;

	if (deepEqual(prevValue, nextValue)) {
		return data;
	}

	return setValue(data, paths, nextValue, { clone: true });
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
	Control extends FormControl<infer Intent> ? Intent : never;

export type FormAction<FormShape, ErrorShape, Intent> = {
	type: 'server' | 'client';
	result: SubmissionResult<FormShape, ErrorShape, Intent>;
	reset: () => FormState<FormShape, ErrorShape>;
};

export type FormControl<Intent extends UnknownIntent = never> = {
	initializeState<FormShape, ErrorShape>(): FormState<FormShape, ErrorShape>;
	updateState<FormShape, ErrorShape>(
		state: FormState<FormShape, ErrorShape>,
		action: FormAction<FormShape, ErrorShape, Intent>,
	): FormState<FormShape, ErrorShape>;
	serializeIntent(intent: UnknownIntent): string;
	deserializeIntent(value: string): UnknownIntent;
	parseIntent(intent: UnknownIntent): Intent | undefined;
	updateValue(
		value: Record<string, FormValue>,
		intent: Intent,
	): Record<string, FormValue> | null;
	getSideEffect<FormShape, ErrorShape>(
		intent: Intent,
		state: FormState<FormShape, ErrorShape>,
	): ((formElement: HTMLFormElement) => void) | null;
};

export function applyIntent(
	submission: Submission,
	options?: {
		control?: undefined;
		pendingIntents?: Array<FormControlIntent<typeof baseControl>>;
	},
): [
	FormControlIntent<typeof baseControl> | undefined | null,
	Record<string, FormValue> | null,
];
export function applyIntent<Intent extends UnknownIntent>(
	submission: Submission,
	options: {
		control: FormControl<Intent>;
		pendingIntents?: Array<Intent>;
	},
): [Intent | undefined | null, Record<string, FormValue> | null];
export function applyIntent<Intent extends UnknownIntent>(
	submission: Submission,
	options?: {
		control?: FormControl<Intent | FormControlIntent<typeof baseControl>>;
		pendingIntents?: Array<Intent | FormControlIntent<typeof baseControl>>;
	},
): [
	Intent | FormControlIntent<typeof baseControl> | undefined | null,
	Record<string, FormValue> | null,
] {
	const { control = baseControl, pendingIntents = [] } = options ?? {};

	if (!submission.intent) {
		return [null, submission.value];
	}

	const intent = control.parseIntent(
		control.deserializeIntent(submission.intent),
	);

	let value: Record<string, FormValue> | null = submission.value;

	for (const pendingIntent of pendingIntents.concat(intent ?? [])) {
		value = control.updateValue(value, pendingIntent);

		if (value === null) {
			break;
		}
	}

	return [intent, value];
}

export type FieldName<FieldShape> = string & {
	'~field'?: FieldShape;
};

export type ResetIntent = {
	type: 'reset';
};

export type ValidateIntent = {
	type: 'validate';
	payload?: string;
};

export type UpdateIntent = {
	type: 'update';
	payload: {
		name?: string;
		index?: number;
		value: FormValue<string | number | boolean | null>;
	};
};

export type ListIntent =
	| {
			type: 'insert';
			payload: {
				name: FieldName<any[]>;
				index?: number;
				defaultValue?: FormValue<string | number | boolean | null>;
			};
	  }
	| {
			type: 'remove';
			payload: {
				name: FieldName<any[]>;
				index: number;
			};
	  }
	| {
			type: 'reorder';
			payload: {
				name: FieldName<any[]>;
				from: number;
				to: number;
			};
	  };

export const baseControl: FormControl<
	ResetIntent | ValidateIntent | UpdateIntent | ListIntent
> = {
	initializeState() {
		return {
			keys: {},
			initialValue: null,
			submittedValue: null,
			serverError: null,
			clientError: null,
			touchedFields: [],
		};
	},
	updateState(prev, { type, result, reset }) {
		const intent = result.intent;

		if (result.value === null || intent?.type === 'reset') {
			return reset();
		}

		const next = {
			...prev,
			clientError:
				type === 'client' &&
				typeof result.error !== 'undefined' &&
				!deepEqual(prev.clientError, result.error)
					? result.error
					: prev.clientError,
			serverError:
				type === 'server'
					? // Update server error only if the error is different from the previous one
						result.error
						? !deepEqual(prev.serverError, result.error)
							? result.error
							: prev.serverError
						: null
					: // Reset server error only if the submitted value is different
						typeof result.error !== 'undefined' &&
						  !deepEqual(
								prev.submittedValue,
								result.value ?? result.submission.value,
						  )
						? null
						: prev.serverError,
			submittedValue:
				type === 'server'
					? result.value ?? result.submission.value
					: prev.submittedValue,
			initialValue:
				type === 'server'
					? result.value ?? result.submission.value
					: prev.initialValue,
		};

		if (intent === null || intent?.type === 'validate') {
			const name = intent?.payload ?? '';

			if (name === '') {
				const fields = result.submission.fields;

				// Sometimes we couldn't find out all the fields from the FormData, e.g. unchecked checkboxes
				// But the schema might have an error on those fields, so we need to include them
				if (result.error) {
					for (const name of Object.keys(result.error.fieldError)) {
						// If the error is set as a child of an actual field, exclude it
						// e.g. A multi file input field (name="files") but the error is set on the first file (i.e. files[0])
						if (
							fields.find(
								(field) =>
									field !== name && getChildPaths(field, name) !== null,
							)
						) {
							continue;
						}

						// If the name is not a child of any fields, this could be an unchecked checkbox or an empty multi select
						if (fields.every((field) => getChildPaths(name, field) === null)) {
							fields.push(name);
						}
					}
				}

				return {
					...next,
					touchedFields: deepEqual(next.touchedFields, fields)
						? next.touchedFields
						: fields,
				};
			}

			if (!next.touchedFields.includes(name)) {
				return {
					...next,
					touchedFields: next.touchedFields.concat(name),
				};
			}
		} else if (intent?.type === 'update') {
			return {
				...next,
				initialValue: result.value ?? result.submission.value,
			};
		} else {
			// We wanna know the value before it is updated
			// However, `sumission.value` might not be correct if there are pending intents
			const formValue = next.initialValue ?? result.submission.value;

			switch (intent?.type) {
				case 'insert': {
					const list = getListValue(formValue, intent.payload.name);
					const index = intent.payload.index ?? list.length;
					const updateListIndex = configureListIndexUpdate(
						intent.payload.name,
						(currentIndex) =>
							index <= currentIndex ? currentIndex + 1 : currentIndex,
					);
					const touchedFields = addItems(
						mapItems(next.touchedFields, updateListIndex),
						[intent.payload.name],
					);

					if (type === 'server') {
						return {
							...next,
							touchedFields,
						};
					}
					const listKeys = Array.from(
						next.keys[intent.payload.name] ??
							getDefaultListKey(formValue, intent.payload.name),
					);
					const itemName = getName(intent.payload.name, index);

					insertItem(listKeys, generateKey(), index);

					return {
						...next,
						keys: {
							// Remove all child keys
							...updateKeys(next.keys, itemName, updateListIndex),
							// Update existing list keys
							[intent.payload.name]: listKeys,
						},
						initialValue: result.value ?? result.submission.value,
						touchedFields,
					};
				}
				case 'remove': {
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
						mapItems(next.touchedFields, updateListIndex),
						[intent.payload.name],
					);

					if (type === 'server') {
						return {
							...next,
							touchedFields,
						};
					}

					const listKeys = Array.from(
						next.keys[intent.payload.name] ??
							getDefaultListKey(formValue, intent.payload.name),
					);

					removeItem(listKeys, intent.payload.index);

					return {
						...next,
						keys: {
							// Remove all child keys
							...updateKeys(
								next.keys,
								getName(intent.payload.name, intent.payload.index),
								updateListIndex,
							),
							// Update existing list keys
							[intent.payload.name]: listKeys,
						},
						initialValue: result.value ?? result.submission.value,
						touchedFields,
					};
				}
				case 'reorder': {
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
						mapItems(next.touchedFields, updateListIndex),
						[intent.payload.name],
					);

					if (type === 'server') {
						return {
							...next,
							touchedFields,
						};
					}

					const listKeys = Array.from(
						next.keys[intent.payload.name] ??
							getDefaultListKey(formValue, intent.payload.name),
					);

					reorderItems(listKeys, intent.payload.from, intent.payload.to);

					return {
						...next,
						keys: {
							// Remove all child keys
							...updateKeys(
								next.keys,
								getName(intent.payload.name, intent.payload.from),
								updateListIndex,
							),
							// Update existing list keys
							[intent.payload.name]: listKeys,
						},
						initialValue: result.value ?? result.submission.value,
						touchedFields,
					};
				}
			}
		}

		return mutate(prev, next);
	},
	deserializeIntent(value) {
		return deserializeIntent(value);
	},
	serializeIntent(intent) {
		return serializeIntent(intent);
	},
	parseIntent(intent) {
		if (intent.type === 'reset') {
			return intent as ResetIntent;
		} else if (intent.type === 'validate' && isOptionalString(intent.payload)) {
			return intent as ValidateIntent;
		} else if (
			intent.type === 'update' &&
			isPlainObject(intent.payload) &&
			isOptionalString(intent.payload.name) &&
			isNonNullable(intent.payload.value) &&
			isOptionalNumber(intent.payload.index)
		) {
			return intent as UpdateIntent;
		} else if (
			(intent.type === 'insert' &&
				isPlainObject(intent.payload) &&
				isString(intent.payload.name) &&
				isOptionalNumber(intent.payload.index)) ||
			(intent.type === 'remove' &&
				isPlainObject(intent.payload) &&
				isString(intent.payload.name) &&
				isNumber(intent.payload.index)) ||
			(intent.type === 'reorder' &&
				isPlainObject(intent.payload) &&
				isString(intent.payload.name) &&
				isNumber(intent.payload.from) &&
				isNumber(intent.payload.to))
		) {
			return intent as ListIntent;
		}
	},
	updateValue(value, intent) {
		if (intent.type === 'reset') {
			return null;
		}

		if (intent.type === 'update') {
			return modify(
				value,
				getName(intent.payload.name, intent.payload.index),
				intent.payload.value,
			);
		}

		switch (intent.type) {
			case 'insert': {
				const list = Array.from<any>(getListValue(value, intent.payload.name));
				insertItem(
					list,
					intent.payload.defaultValue,
					intent.payload.index ?? list.length,
				);
				return modify(value, intent.payload.name, list);
			}
			case 'remove': {
				const list = Array.from<any>(getListValue(value, intent.payload.name));
				removeItem(list, intent.payload.index);
				return modify(value, intent.payload.name, list);
			}
			case 'reorder': {
				const list = Array.from<any>(getListValue(value, intent.payload.name));
				reorderItems(list, intent.payload.from, intent.payload.to);
				return modify(value, intent.payload.name, list);
			}
		}

		return value;
	},
	getSideEffect(intent) {
		if (intent.type === 'reset') {
			return (formElement) => formElement.reset();
		}

		if (intent.type === 'update') {
			return (formElement) => {
				const name = getName(intent.payload.name, intent.payload.index);
				const parentPaths = getPaths(name);

				for (const element of formElement.elements) {
					if (isInput(element)) {
						const paths = getChildPaths(parentPaths, element.name);

						if (paths) {
							updateFieldValue(element, {
								value: serialize(getValue(intent.payload.value, paths)),
							});

							// Update the element attribute to notify that this is changed by Conform
							element.dataset.conform = generateKey();
						}
					}
				}
			};
		}

		return null;
	},
};
