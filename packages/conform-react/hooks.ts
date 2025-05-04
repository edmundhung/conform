import {
	type FormId,
	type FieldName,
	createGlobalFormsObserver,
	getFieldValue,
	deepEqual,
	focus,
	change,
	blur,
	isFieldElement,
} from '@conform-to/dom';
import {
	useEffect,
	useId,
	useState,
	useLayoutEffect,
	useRef,
	useSyncExternalStore,
	useCallback,
} from 'react';
import {
	type FormMetadata,
	type FieldMetadata,
	type Pretty,
	type FormOptions,
	createFormContext,
	useFormState,
	useFormContext,
	useSubjectRef,
	getFieldMetadata,
	getFormMetadata,
} from './context';
import { normalizeFieldValue, setVisuallyHidden } from './util';

/**
 * useLayoutEffect is client-only.
 * This basically makes it a no-op on server
 */
export const useSafeLayoutEffect =
	typeof document === 'undefined' ? useEffect : useLayoutEffect;

export function useFormId<Schema extends Record<string, unknown>, FormError>(
	preferredId?: string,
): FormId<Schema, FormError> {
	const id = useId();

	return preferredId ?? id;
}

export function useNoValidate(defaultNoValidate = true): boolean {
	const [noValidate, setNoValidate] = useState(defaultNoValidate);

	useSafeLayoutEffect(() => {
		// This is necessary to fix an issue in strict mode with related to our proxy setup
		// It avoids the component from being rerendered without re-rendering the child
		// Which reset the proxy but failed to capture its usage within child component
		if (!noValidate) {
			setNoValidate(true);
		}
	}, [noValidate]);

	return noValidate;
}

export function useForm<
	Schema extends Record<string, any>,
	FormValue = Schema,
	FormError = string[],
>(
	options: Pretty<
		Omit<FormOptions<Schema, FormError, FormValue>, 'formId'> & {
			/**
			 * The form id. If not provided, a random id will be generated.
			 */
			id?: string;

			/**
			 * Enable constraint validation before the dom is hydated.
			 *
			 * Default to `true`.
			 */
			defaultNoValidate?: boolean;
		}
	>,
): [
	FormMetadata<Schema, FormError>,
	ReturnType<FormMetadata<Schema, FormError>['getFieldset']>,
] {
	const { id, ...formConfig } = options;
	const formId = useFormId<Schema, FormError>(id);
	const [context] = useState(() =>
		createFormContext({ ...formConfig, formId }),
	);

	useSafeLayoutEffect(() => {
		const disconnect = context.observe();
		document.addEventListener('input', context.onInput);
		document.addEventListener('focusout', context.onBlur);
		document.addEventListener('reset', context.onReset);

		return () => {
			disconnect();
			document.removeEventListener('input', context.onInput);
			document.removeEventListener('focusout', context.onBlur);
			document.removeEventListener('reset', context.onReset);
		};
	}, [context]);

	useSafeLayoutEffect(() => {
		context.onUpdate({ ...formConfig, formId });
	});

	const subjectRef = useSubjectRef({
		pendingIntents: true,
	});
	const stateSnapshot = useFormState(context, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);
	const form = getFormMetadata(context, subjectRef, stateSnapshot, noValidate);

	useEffect(() => {
		context.runSideEffect(stateSnapshot.pendingIntents);
	}, [context, stateSnapshot.pendingIntents]);

	return [form, form.getFieldset()];
}

export function useFormMetadata<
	Schema extends Record<string, any>,
	FormError = string[],
>(
	formId?: FormId<Schema, FormError>,
	options: {
		defaultNoValidate?: boolean;
	} = {},
): FormMetadata<Schema, FormError> {
	const subjectRef = useSubjectRef();
	const context = useFormContext(formId);
	const stateSnapshot = useFormState(context, subjectRef);
	const noValidate = useNoValidate(options.defaultNoValidate);

	return getFormMetadata(context, subjectRef, stateSnapshot, noValidate);
}

export function useField<
	FieldSchema,
	FormSchema extends Record<string, unknown> = Record<string, unknown>,
	FormError = string[],
>(
	name: FieldName<FieldSchema, FormSchema, FormError>,
	options: {
		formId?: FormId<FormSchema, FormError>;
	} = {},
): [
	FieldMetadata<FieldSchema, FormSchema, FormError>,
	FormMetadata<FormSchema, FormError>,
] {
	const subjectRef = useSubjectRef();
	const context = useFormContext(options.formId);
	const stateSnapshot = useFormState(context, subjectRef);
	const field = getFieldMetadata<FieldSchema, FormSchema, FormError>(
		context,
		subjectRef,
		stateSnapshot,
		name,
	);
	const form = getFormMetadata(context, subjectRef, stateSnapshot, false);

	return [field, form];
}

export type Control = {
	value: string | undefined;
	checked: boolean | undefined;
	options: string[] | undefined;
	files: File[] | undefined;
	register: (
		element:
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLCollectionOf<HTMLInputElement>
			| NodeListOf<HTMLInputElement>
			| null
			| undefined,
	) => void;
	change(value: string | string[] | boolean | File | File[] | FileList): void;
	focus(): void;
	blur(): void;
};

export const formObserver = createGlobalFormsObserver();

export function useControl(options?: {
	defaultValue?: string | string[] | File | File[] | null | undefined;
	defaultChecked?: boolean | undefined;
	value?: string;
	hidden?: boolean;
}): Control {
	const inputRef = useRef<
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| Array<HTMLInputElement>
		| null
	>(null);
	const eventDispatched = useRef({
		change: false,
		focus: false,
		blur: false,
	});
	const snapshotRef = useRef<string[] | File[] | null | undefined>();

	if (typeof snapshotRef.current === 'undefined') {
		snapshotRef.current = normalizeFieldValue(
			options?.defaultChecked ? options.value ?? 'on' : options?.defaultValue,
		);
	}

	const value = useSyncExternalStore(
		useCallback(
			(callback) =>
				formObserver.onFieldUpdate((event) => {
					const input = event.target;

					if (
						Array.isArray(inputRef.current)
							? inputRef.current.some((item) => item === input)
							: inputRef.current === input
					) {
						callback();
					}
				}),
			[],
		),
		() => {
			const prev = snapshotRef.current;
			const next = inputRef.current
				? normalizeFieldValue(getFieldValue(inputRef.current))
				: null;

			if (deepEqual(prev, next)) {
				return prev;
			}

			snapshotRef.current = next;
			return next;
		},
		() => snapshotRef.current,
	);

	useEffect(() => {
		const createEventListener = (listener: 'change' | 'focus' | 'blur') => {
			return (event: Event) => {
				if (
					Array.isArray(inputRef.current)
						? inputRef.current.some((item) => item === event.target)
						: inputRef.current === event.target
				) {
					eventDispatched.current[listener] = true;
				}
			};
		};
		const inputHandler = createEventListener('change');
		const focusHandler = createEventListener('focus');
		const blurHandler = createEventListener('blur');

		document.addEventListener('input', inputHandler, true);
		document.addEventListener('focusin', focusHandler, true);
		document.addEventListener('focusout', blurHandler, true);

		return () => {
			document.removeEventListener('input', inputHandler, true);
			document.removeEventListener('focusin', focusHandler, true);
			document.removeEventListener('focusout', blurHandler, true);
		};
	}, []);

	const strings = value?.every((item) => typeof item === 'string')
		? value
		: undefined;
	const files = value?.every((item) => typeof item !== 'string')
		? value
		: undefined;

	return {
		value: strings?.[0],
		checked: strings?.[0] === (options?.value ?? 'on'),
		options: strings,
		files,
		register: useCallback(
			(element) => {
				if (!element) {
					inputRef.current = null;
				} else if (isFieldElement(element)) {
					inputRef.current = element;

					if (options?.hidden) {
						setVisuallyHidden(element);
					}
				} else {
					const inputs = Array.from(element);
					const name = inputs[0]?.name ?? '';
					const type = inputs[0]?.type ?? '';

					if (
						!name ||
						!(type === 'checkbox' || type === 'radio') ||
						!inputs.every((input) => input.name === name && input.type === type)
					) {
						throw new Error(
							'You can only register a checkbox or radio group with the same name',
						);
					}

					inputRef.current = inputs;

					if (options?.hidden) {
						for (const input of inputs) {
							setVisuallyHidden(input);
						}
					}
				}
			},
			[options?.hidden],
		),
		change: useCallback(
			(value) => {
				if (!eventDispatched.current.change) {
					eventDispatched.current.change = true;

					const inputValue =
						typeof value === 'boolean'
							? value
								? options?.value ?? 'on'
								: ''
							: value;
					const element = Array.isArray(inputRef.current)
						? inputRef.current?.find((input) => {
								const wasChecked = input.checked;
								const isChecked = Array.isArray(inputValue)
									? inputValue.some((item) => item === input.value)
									: input.value === value;

								switch (input.type) {
									case 'checkbox':
										// We assume that only one checkbox can be checked at a time
										// So we will pick the first element with checked state changed
										return wasChecked !== isChecked;
									case 'radio':
										// We cannot uncheck a radio button
										// So we will pick the first element that should be checked
										return !wasChecked && isChecked;
								}
							})
						: inputRef.current;

					if (element) {
						change(element, inputValue);
					}
				}

				eventDispatched.current.change = false;
			},
			[options?.value],
		),
		focus: useCallback(() => {
			if (!eventDispatched.current.focus) {
				eventDispatched.current.focus = true;

				const element = Array.isArray(inputRef.current)
					? inputRef.current[0]
					: inputRef.current;

				if (element) {
					focus(element);
				}
			}

			eventDispatched.current.focus = false;
		}, []),
		blur: useCallback(() => {
			if (!eventDispatched.current.blur) {
				eventDispatched.current.blur = true;

				const element = Array.isArray(inputRef.current)
					? inputRef.current[0]
					: inputRef.current;

				if (element) {
					blur(element);
				}
			}

			eventDispatched.current.blur = false;
		}, []),
	};
}
