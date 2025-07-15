import {
	deepEqual,
	focus,
	change,
	blur,
	isFieldElement,
	getFormData,
} from '@conform-to/dom/future';
import {
	useEffect,
	useRef,
	useSyncExternalStore,
	useCallback,
	useContext,
} from 'react';
import {
	type FormRef,
	focusable,
	getCheckboxGroupValue,
	getDefaultSnapshot,
	getFormElement,
	getInputSnapshot,
	getRadioGroupValue,
	initializeField,
} from './util';
import { FormContext } from './context';

export type Control = {
	/**
	 * Current value of the base input. Undefined if the registered input
	 * is a multi-select, file input, or checkbox group.
	 */
	value: string | undefined;
	/**
	 * Selected options of the base input. Defined only when the registered input
	 * is a multi-select or checkbox group.
	 */
	checked: boolean | undefined;
	/**
	 * Checked state of the base input. Defined only when the registered input
	 * is a single checkbox or radio input.
	 */
	options: string[] | undefined;
	/**
	 * Selected files of the base input. Defined only when the registered input
	 * is a file input.
	 */
	files: File[] | undefined;
	/**
	 * Registers the base input element(s). Accepts a single input or an array for groups.
	 */
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
	/**
	 * Programmatically updates the input value and emits
	 * both [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and
	 * [input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) events.
	 */
	change(
		value: string | string[] | boolean | File | File[] | FileList | null,
	): void;
	/**
	 * Emits [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event) and
	 * [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) events.
	 * Does not actually move focus.
	 */
	focus(): void;
	/**
	 * Emits [focus](https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event) and
	 * [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) events.
	 * This does not move the actual keyboard focus to the input. Use `element.focus()` instead
	 * if you want to move focus to the input.
	 */
	blur(): void;
};

/**
 * A React hook that lets you sync the state of an input and dispatch native form events from it.
 * This is useful when emulating native input behavior — typically by rendering a hidden base input
 * and syncing it with a custom input.
 *
 * @example
 * ```ts
 * const control = useControl(options);
 * ```
 */
export function useControl(options?: {
	/**
	 * The initial value of the base input. It will be used to set the value
	 * when the input is first registered.
	 */
	defaultValue?: string | string[] | File | File[] | null | undefined;
	/**
	 * Whether the base input should be checked by default. It will be applied
	 * when the input is first registered.
	 */
	defaultChecked?: boolean | undefined;
	/**
	 * The value of a checkbox or radio input when checked. This sets the
	 * value attribute of the base input.
	 */
	value?: string;
	/**
	 * A callback function that is triggered when the base input is focused.
	 * Use this to delegate focus to a custom input.
	 */
	onFocus?: () => void;
}): Control {
	const { observer } = useContext(FormContext);
	const inputRef = useRef<
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| Array<HTMLInputElement>
		| null
	>(null);
	const eventDispatched = useRef<{
		change?: number;
		focus?: number;
		blur?: number;
	}>({});

	const defaultSnapshot = getDefaultSnapshot(
		options?.defaultValue,
		options?.defaultChecked,
		options?.value,
	);
	const snapshotRef = useRef(defaultSnapshot);
	const optionsRef = useRef(options);

	useEffect(() => {
		optionsRef.current = options;
	});

	// This is necessary to ensure that input is re-registered
	// if the onFocus handler changes
	const shouldHandleFocus = typeof options?.onFocus === 'function';
	const snapshot = useSyncExternalStore(
		useCallback(
			(callback) =>
				observer.onFieldUpdate((event) => {
					const input = event.target;

					if (
						Array.isArray(inputRef.current)
							? inputRef.current.some((item) => item === input)
							: inputRef.current === input
					) {
						callback();
					}
				}),
			[observer],
		),
		() => {
			const input = inputRef.current;
			const prev = snapshotRef.current;
			const next = !input
				? defaultSnapshot
				: Array.isArray(input)
					? {
							value: getRadioGroupValue(input),
							options: getCheckboxGroupValue(input),
						}
					: getInputSnapshot(input);

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
					const timer = eventDispatched.current[listener];

					if (timer) {
						clearTimeout(timer);
					}

					eventDispatched.current[listener] = window.setTimeout(() => {
						eventDispatched.current[listener] = undefined;
					});

					if (listener === 'focus') {
						optionsRef.current?.onFocus?.();
					}
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

	return {
		value: snapshot.value,
		checked: snapshot.checked,
		options: snapshot.options,
		files: snapshot.files,
		register: useCallback(
			(element) => {
				if (!element) {
					inputRef.current = null;
				} else if (isFieldElement(element)) {
					inputRef.current = element;

					if (shouldHandleFocus) {
						focusable(element);
					}

					if (element.type === 'checkbox' || element.type === 'radio') {
						// React set the value as empty string incorrectly when the value is undefined
						// This make sure the checkbox value falls back to the default value "on" properly
						// @see https://github.com/facebook/react/issues/17590
						element.value = optionsRef.current?.value ?? 'on';
					}

					initializeField(element, optionsRef.current);
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

					for (const input of inputs) {
						if (shouldHandleFocus) {
							focusable(input);
						}

						initializeField(input, {
							// We will not be uitlizing defaultChecked / value on checkbox / radio group
							defaultValue: optionsRef.current?.defaultValue,
						});
					}
				}
			},
			[shouldHandleFocus],
		),
		change: useCallback((value) => {
			if (!eventDispatched.current.change) {
				const element = Array.isArray(inputRef.current)
					? inputRef.current?.find((input) => {
							const wasChecked = input.checked;
							const isChecked = Array.isArray(value)
								? value.some((item) => item === input.value)
								: input.value === value;

							switch (input.type) {
								case 'checkbox':
									// We assume that only one checkbox can be checked at a time
									// So we will pick the first element with checked state changed
									return wasChecked !== isChecked;
								case 'radio':
									// We cannot uncheck a radio button
									// So we will pick the first element that should be checked
									return isChecked;
								default:
									return false;
							}
						})
					: inputRef.current;

				if (element) {
					change(
						element,
						typeof value === 'boolean' ? (value ? element.value : null) : value,
					);
				}
			}

			if (eventDispatched.current.change) {
				clearTimeout(eventDispatched.current.change);
			}

			eventDispatched.current.change = undefined;
		}, []),
		focus: useCallback(() => {
			if (!eventDispatched.current.focus) {
				const element = Array.isArray(inputRef.current)
					? inputRef.current[0]
					: inputRef.current;

				if (element) {
					focus(element);
				}
			}

			if (eventDispatched.current.focus) {
				clearTimeout(eventDispatched.current.focus);
			}

			eventDispatched.current.focus = undefined;
		}, []),
		blur: useCallback(() => {
			if (!eventDispatched.current.blur) {
				const element = Array.isArray(inputRef.current)
					? inputRef.current[0]
					: inputRef.current;

				if (element) {
					blur(element);
				}
			}

			if (eventDispatched.current.blur) {
				clearTimeout(eventDispatched.current.blur);
			}

			eventDispatched.current.blur = undefined;
		}, []),
	};
}

type Selector<FormValue, Result> = (
	formData: FormValue | null,
	lastResult: Result | undefined,
) => Result;

type UseFormDataOptions = {
	/**
	 * Set to `true` to preserve file inputs and receive a `FormData` object in the selector.
	 * If omitted or `false`, the selector receives a `URLSearchParams` object, where all values are coerced to strings.
	 */
	acceptFiles?: boolean;
};

/**
 * A React hook that lets you subscribe to the current `FormData` of a form and derive a custom value from it.
 * The selector runs whenever the form's structure or data changes, and the hook re-renders only when the result is deeply different.
 *
 * @see https://conform.guide/api/react/future/useFormData
 * @example
 * ```ts
 * const value = useFormData(formRef, formData => formData?.get('fieldName').toString() ?? '');
 * ```
 */
export function useFormData<Value = any>(
	formRef: FormRef,
	select: Selector<FormData, Value>,
	options: UseFormDataOptions & {
		acceptFiles: true;
	},
): Value;
export function useFormData<Value = any>(
	formRef: FormRef,
	select: Selector<URLSearchParams, Value>,
	options?: UseFormDataOptions & {
		acceptFiles?: boolean;
	},
): Value;
export function useFormData<Value = any>(
	formRef: FormRef,
	select: Selector<FormData, Value> | Selector<URLSearchParams, Value>,
	options?: UseFormDataOptions,
): Value {
	const { observer } = useContext(FormContext);
	const valueRef = useRef<Value>();
	const formDataRef = useRef<FormData | URLSearchParams | null>(null);
	const value = useSyncExternalStore(
		useCallback(
			(callback) => {
				const formElement = getFormElement(formRef);

				if (formElement) {
					const formData = getFormData(formElement);
					formDataRef.current = options?.acceptFiles
						? formData
						: new URLSearchParams(
								Array.from(formData).map(([key, value]) => [
									key,
									value.toString(),
								]),
							);
				}

				const unsubscribe = observer.onFormUpdate((event) => {
					if (event.target === getFormElement(formRef)) {
						const formData = getFormData(event.target, event.submitter);
						formDataRef.current = options?.acceptFiles
							? formData
							: new URLSearchParams(
									Array.from(formData).map(([key, value]) => [
										key,
										value.toString(),
									]),
								);
						callback();
					}
				});

				return unsubscribe;
			},
			[observer, formRef, options?.acceptFiles],
		),
		() => {
			// @ts-expect-error FIXME
			const result = select(formDataRef.current, valueRef.current);

			if (
				typeof valueRef.current !== 'undefined' &&
				deepEqual(result, valueRef.current)
			) {
				return valueRef.current;
			}

			valueRef.current = result;

			return result;
		},
		() => select(null, undefined),
	);

	return value;
}
