import {
	type RefCallback,
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';
import {
	type Submission,
	type DefaultValue,
	type FormControl,
	type FormControlIntent,
	type FormControlAdditionalState,
	type FormError,
	type FormState,
	type UnknownIntent,
	initializeElement,
	deepEqual,
	requestIntent,
	isInput,
	parseSubmission,
	defaultFormControl,
	report,
} from './conform-dom';
import { flushSync } from 'react-dom';

export function getFormData(event: React.FormEvent<HTMLFormElement>): FormData {
	const submitEvent = event.nativeEvent as SubmitEvent;
	const formData = new FormData(event.currentTarget, submitEvent.submitter);

	return formData;
}

export type FormIntent<Intent> = {
	name: string;
	submit(intent: Intent): void;
	serialize(intent: Intent): string;
};

const defaultIntentName = '__intent__';

export function useForm<
	Schema,
	ErrorShape,
	Intent extends UnknownIntent,
	AdditionalState extends Record<string, unknown> = {},
>(
	formRef: FormRef,
	options: {
		control: FormControl<Intent, AdditionalState>;
		result?:
			| Submission<Intent | null, Schema, ErrorShape>
			| Submission<null, Schema, ErrorShape>
			| null;
		defaultValue?: DefaultValue<Schema>;
		intentName?: string;
		onValidate?: (
			submission: Submission<Intent | null, Schema, ErrorShape>,
		) => FormError<Schema, ErrorShape> | null;
	},
): {
	state: FormState<Schema, ErrorShape, AdditionalState>;
	handleSubmit(
		event: React.FormEvent<HTMLFormElement>,
	): Submission<Intent | null, Schema, ErrorShape>;
	intent: FormIntent<Intent>;
};
export function useForm<Schema, ErrorShape = string[]>(
	formRef: FormRef,
	options?: {
		control?: undefined;
		result?:
			| Submission<
					FormControlIntent<typeof defaultFormControl> | null,
					Schema,
					ErrorShape
			  >
			| Submission<null, Schema, ErrorShape>
			| null;
		defaultValue?: DefaultValue<Schema>;
		intentName?: string;
		onValidate?: (
			submission: Submission<
				FormControlIntent<typeof defaultFormControl> | null,
				Schema,
				ErrorShape
			>,
		) => FormError<Schema, ErrorShape> | null;
	},
): {
	state: FormState<
		Schema,
		ErrorShape,
		FormControlAdditionalState<typeof defaultFormControl>
	>;
	handleSubmit(
		event: React.FormEvent<HTMLFormElement>,
	): Submission<
		FormControlIntent<typeof defaultFormControl> | null,
		Schema,
		ErrorShape
	>;
	intent: FormIntent<FormControlIntent<typeof defaultFormControl>>;
};
export function useForm<
	Schema,
	ErrorShape,
	Intent extends UnknownIntent,
	AdditionalState extends Record<string, unknown> = {},
>(
	formRef: FormRef,
	options?: {
		control?: FormControl<
			Intent | FormControlIntent<typeof defaultFormControl>,
			AdditionalState | FormControlAdditionalState<typeof defaultFormControl>
		>;
		result?:
			| Submission<
					Intent | FormControlIntent<typeof defaultFormControl> | null,
					Schema,
					ErrorShape
			  >
			| Submission<null, Schema, ErrorShape>
			| null;
		defaultValue?: DefaultValue<Schema>;
		intentName?: string;
		onValidate?: (
			submission: Submission<
				Intent | FormControlIntent<typeof defaultFormControl> | null,
				Schema,
				ErrorShape
			>,
		) => FormError<Schema, ErrorShape> | null;
	},
): {
	state: FormState<
		Schema,
		ErrorShape,
		AdditionalState | FormControlAdditionalState<typeof defaultFormControl>
	>;
	handleSubmit(
		event: React.FormEvent<HTMLFormElement>,
	): Submission<
		Intent | FormControlIntent<typeof defaultFormControl> | null,
		Schema,
		ErrorShape
	>;
	intent: FormIntent<Intent | FormControlIntent<typeof defaultFormControl>>;
} {
	const {
		intentName = defaultIntentName,
		control = defaultFormControl,
		defaultValue,
		result,
	} = options ?? {};
	const [state, setState] = useState(() =>
		control.initializeState({
			defaultValue,
			result,
		}),
	);
	const optionsRef = useRef(options);
	const lastStateRef = useRef(state);
	const lastResultRef = useRef(result);
	const intent = useFormIntent(formRef, {
		intentName,
		control,
	});
	const [runSideEffect, setSideEffect] = useState<
		((formElement: HTMLFormElement) => void) | null
	>(null);

	const update = useCallback(
		(
			result: Submission<
				Intent | FormControlIntent<typeof defaultFormControl> | null,
				Schema,
				ErrorShape
			>,
		) => {
			if (result === lastResultRef.current) {
				return;
			}

			lastResultRef.current = result;

			const { control = defaultFormControl, defaultValue } =
				optionsRef.current ?? {};

			setState((state) =>
				control.updateState(state, {
					result,
					reset() {
						return control.initializeState<Schema, ErrorShape>({
							defaultValue,
						});
					},
				}),
			);

			if (result.intent) {
				const sideEffectFn = control.getSideEffect(result.intent);

				if (sideEffectFn) {
					setSideEffect(() => sideEffectFn);
				}
			}
		},
		[],
	);

	useEffect(() => {
		optionsRef.current = options;
		lastStateRef.current = state;
	});

	useEffect(() => {
		const formElement = getFormElement(formRef);

		if (formElement) {
			for (const element of formElement.elements) {
				if (isInput(element)) {
					initializeElement(element, lastStateRef.current.initialValue);
				}
			}
		}

		return formObserver.onInputMounted((element) =>
			initializeElement(element, lastStateRef.current.initialValue),
		);
	}, []);

	useEffect(() => {
		if (result) {
			update(result);
		}
	}, [result, update]);

	useEffect(() => {
		const formElement = getFormElement(formRef);

		if (!formElement) {
			return;
		}

		return runSideEffect?.(formElement);
	}, [formRef, runSideEffect]);

	return {
		state,
		handleSubmit(event: React.FormEvent<HTMLFormElement>) {
			const formData = getFormData(event);
			const submission = parseSubmission<Schema, ErrorShape>(formData, {
				intentName,
			});
			const refinedSubmission = control.refineSubmission(submission);
			const error = optionsRef.current?.onValidate?.(refinedSubmission);
			const result = report(refinedSubmission, {
				keepFile: true,
				error,
			});

			if (result.error || result.intent) {
				event.preventDefault();
			}

			flushSync(() => {
				update(result);
			});

			return result;
		},
		intent,
	};
}

export function useFormIntent<
	Intent extends UnknownIntent = FormControlIntent<typeof defaultFormControl>,
>(
	formRef: FormRef,
	options?: {
		intentName?: string;
		control?: FormControl<
			Intent | FormControlIntent<typeof defaultFormControl>
		>;
	},
): FormIntent<Intent> {
	const { intentName = defaultIntentName, control = defaultFormControl } =
		options ?? {};

	return useMemo(
		() => ({
			name: intentName,
			serialize(intent: Intent) {
				return control.serializeIntent(intent);
			},
			submit(intent: Intent) {
				const formElement = getFormElement(formRef);

				requestIntent(formElement, intentName, control.serializeIntent(intent));
			},
		}),
		[formRef, intentName, control],
	);
}

type FormRef =
	| RefObject<
			| HTMLFormElement
			| HTMLFieldSetElement
			| HTMLInputElement
			| HTMLSelectElement
			| HTMLTextAreaElement
			| HTMLButtonElement
	  >
	| string;

function getFormElement(formRef: FormRef | undefined): HTMLFormElement | null {
	if (typeof formRef === 'string') {
		return document.forms.namedItem(formRef);
	}

	const element = formRef?.current;

	if (element instanceof HTMLFormElement) {
		return element;
	}

	return element?.form ?? null;
}

export function useFormData<Value>(
	formRef: FormRef,
	select: (formData: FormData, currentValue: Value | undefined) => Value,
): Value | undefined {
	const previous = useRef<Value>();
	const result = useSyncExternalStore(
		useCallback(
			(callback) =>
				formObserver.onFormDataChanged(({ formElement }) => {
					if (formElement === getFormElement(formRef)) {
						callback();
					}
				}),
			[],
		),
		() => {
			const formElement = getFormElement(formRef);

			if (!formElement) {
				return;
			}

			const formData = new FormData(formElement);
			const value = select(formData, previous.current);

			return value;
		},
		() => undefined,
	);

	previous.current = result;

	return result;
}

export function updateFieldValue(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	value: string | string[],
): void {
	if (
		element instanceof HTMLInputElement &&
		(element.type === 'checkbox' || element.type === 'radio')
	) {
		const wasChecked = element.checked;
		const willChecked = Array.isArray(value)
			? value.includes(element.value)
			: element.value === value;

		if (wasChecked !== willChecked) {
			element.click();
			return;
		}
	} else if (element instanceof HTMLSelectElement) {
		let updated = false;
		const selectedValue = Array.isArray(value) ? [...value] : [value];

		for (const option of element.options) {
			const index = selectedValue.indexOf(option.value);
			const selected = index > -1;

			// Update the selected state of the option
			if (option.selected !== selected) {
				option.selected = selected;
				updated = true;
			}
			// Remove the option from the selected array
			if (selected) {
				selectedValue.splice(index, 1);
			}
		}

		// Add the remaining options to the select element
		for (const option of selectedValue) {
			updated = true;

			if (typeof option === 'string') {
				element.options.add(new Option(option, option, false, true));
			}
		}

		if (!updated) {
			return;
		}
	} else {
		// No `change` event will be triggered on React if `element.value` is already updated
		if (element.value === value) {
			return;
		}

		/**
		 * Triggering react custom change event
		 * Solution based on dom-testing-library
		 * @see https://github.com/facebook/react/issues/10135#issuecomment-401496776
		 * @see https://github.com/testing-library/dom-testing-library/blob/main/src/events.js#L104-L123
		 */
		const { set: valueSetter } =
			Object.getOwnPropertyDescriptor(element, 'value') || {};
		const prototype = Object.getPrototypeOf(element);
		const { set: prototypeValueSetter } =
			Object.getOwnPropertyDescriptor(prototype, 'value') || {};

		if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
			prototypeValueSetter.call(element, value);
		} else {
			if (valueSetter) {
				valueSetter.call(element, value);
			} else {
				throw new Error('The given element does not have a value setter');
			}
		}
	}

	// Dispatch input event with the updated input value
	element.dispatchEvent(new InputEvent('input', { bubbles: true }));
	// Dispatch change event (necessary for select to update the selected option)
	element.dispatchEvent(new Event('change', { bubbles: true }));
}

export function useInputControl(initialValue: string): {
	value: string;
	changed(value: string): void;
	focused(): void;
	blurred(): void;
	register: RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
};
export function useInputControl(initialValue: string[]): {
	value: string[];
	changed(value: string[]): void;
	focused(): void;
	blurred(): void;
	register: RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
};
export function useInputControl(initialValue?: string | string[]): {
	value: string | string[] | undefined;
	changed(value: string | string[]): void;
	focused(): void;
	blurred(): void;
	register: RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
};
export function useInputControl(initialValue?: string | string[]) {
	const inputRef = useRef<
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| null
		| undefined
	>();
	const previous = useRef<string | string[] | undefined>();
	const eventDispatched = useRef<Record<string, boolean>>({});
	const value = useSyncExternalStore(
		useCallback(
			(callback) =>
				formObserver.onInputChanged((inputElement) => {
					if (inputElement === inputRef.current) {
						callback();
					}
				}),
			[],
		),
		() => {
			if (!inputRef.current) {
				// eslint-disable-next-line no-console
				console.log(
					'No input element is registered yet; Did you forget to call the `register` function?',
				);
				return initialValue;
			}

			const element = inputRef.current;
			const isMultipleSelect =
				element instanceof HTMLSelectElement && element.multiple;
			const prev = previous.current;
			const next = isMultipleSelect
				? Array.from(element.selectedOptions).map((option) => option.value)
				: element.value;

			if (deepEqual(prev, next)) {
				return prev;
			}

			return next;
		},
		() => initialValue,
	);

	previous.current = value;

	useEffect(() => {
		const deduplicateEvent = (event: Event) => {
			const element = inputRef.current;

			if (element && event.target === element) {
				eventDispatched.current[event.type] = true;
			}
		};

		return () => {
			document.removeEventListener('focusin', deduplicateEvent, true);
			document.removeEventListener('focusout', deduplicateEvent, true);
		};
	}, []);

	const control = useMemo<{
		changed(value: string | string[]): void;
		focused(): void;
		blurred(): void;
		register: RefCallback<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
		>;
	}>(() => {
		return {
			register(element) {
				inputRef.current = element;
			},
			changed(value) {
				const element = inputRef.current;

				if (element) {
					updateFieldValue(element, value);
				}
			},
			focused() {
				if (!eventDispatched.current.focusin) {
					return;
				}

				const element = inputRef.current;

				if (element) {
					element.dispatchEvent(
						new FocusEvent('focusin', {
							bubbles: true,
						}),
					);
					element.dispatchEvent(new FocusEvent('focus'));
				}

				eventDispatched.current.focusin = false;
			},
			blurred() {
				if (!eventDispatched.current.focusout) {
					return;
				}
				const element = inputRef.current;

				if (element) {
					element.dispatchEvent(
						new FocusEvent('focusout', {
							bubbles: true,
						}),
					);
					element.dispatchEvent(new FocusEvent('blur'));
				}

				eventDispatched.current.focusout = false;
			},
		};
	}, []);

	return {
		value,
		changed: control.changed,
		focused: control.focused,
		blurred: control.blurred,
		register: control.register,
	};
}

export type FormObserver = {
	/**
	 * Subscribes to the event when a new input element is mounted (added to the DOM).
	 *
	 * @param callback - Function invoked with the newly mounted input elements.
	 * @returns A function to unsubscribe the callback.
	 */
	onInputMounted(
		callback: (
			inputElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
		) => void,
	): () => void;

	/**
	 * Subscribes to the event when an input element's value changes.
	 * @param callback - Function invoked with the input element.
	 * @returns A function to unsubscribe the callback.
	 */
	onInputChanged(
		callback: (
			inputElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
		) => void,
	): () => void;

	/**
	 * Subscribes to the event when a form's value changes.
	 *
	 * @param callback - Function invoked with the form element and its FormData.
	 * @returns A function to unsubscribe the callback.
	 */
	onFormDataChanged(
		callback: (formElement: HTMLFormElement, formData: FormData) => void,
	): () => void;
};

export function createFormObserver(): FormObserver {
	const inputMountedCallbacks = new Set<
		Parameters<FormObserver['onInputMounted']>[0]
	>();
	const inputChangedCallbacks = new Set<
		Parameters<FormObserver['onInputChanged']>[0]
	>();
	const formDataChangedCallbacks = new Set<
		Parameters<FormObserver['onFormDataChanged']>[0]
	>();

	let observer: MutationObserver | null = null;

	function handleInput(event: Event) {
		const element = event.target;

		if (isInput(element)) {
			emitInputChanged(element);

			if (element.form) {
				emitFormDataChanged(element.form);
			}
		}
	}

	function handleReset(event: Event) {
		if (event.target instanceof HTMLFormElement) {
			emitFormDataChanged(event.target);
		}
	}

	function handleSubmit(event: SubmitEvent): void {
		if (event.target instanceof HTMLFormElement) {
			emitFormDataChanged(event.target, event.submitter);
		}
	}

	function handleMutation(mutations: MutationRecord[]): void {
		const formDataChanged = new Set<HTMLFormElement>();
		const inputElementMoutned = new Set<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>();
		const inputElementChanged = new Set<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>();
		const getInputs = (node: Node) => {
			if (isInput(node)) {
				return [node];
			}

			if (node instanceof Element) {
				return Array.from(
					node.querySelectorAll<
						HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
					>('input,select,textarea'),
				);
			}

			return [];
		};
		for (const mutation of mutations) {
			switch (mutation.type) {
				case 'childList':
					for (const node of mutation.addedNodes) {
						for (const input of getInputs(node)) {
							if (input.form) {
								inputElementMoutned.add(input);
								formDataChanged.add(input.form);
							}
						}
					}
					for (const node of mutation.removedNodes) {
						for (const input of getInputs(node)) {
							if (input.form) {
								formDataChanged.add(input.form);
							}
						}
					}
					break;
				case 'attributes':
					if (isInput(mutation.target)) {
						inputElementChanged.add(mutation.target);

						if (mutation.target.form) {
							formDataChanged.add(mutation.target.form);
						}
					}
					break;
			}
		}

		for (const formElement of formDataChanged) {
			emitFormDataChanged(formElement);
		}

		for (const inputElement of inputElementChanged) {
			emitInputChanged(inputElement);
		}

		for (const inputElement of inputElementMoutned) {
			emitInputMounted(inputElement);
		}
	}

	function emitInputMounted(
		inputElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	) {
		for (const callback of inputMountedCallbacks) {
			callback(inputElement);
		}
	}

	function emitInputChanged(
		inputElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	) {
		for (const callback of inputChangedCallbacks) {
			callback(inputElement);
		}
	}

	function emitFormDataChanged(
		formElement: HTMLFormElement,
		submitter: HTMLElement | null = null,
	) {
		const formData = new FormData(formElement, submitter);

		for (const callback of formDataChangedCallbacks) {
			callback(formElement, formData);
		}
	}

	function initialize() {
		// If there are no subscribers yet, listen for input, reset, and submit events globally
		if (
			formDataChangedCallbacks.size === 0 &&
			inputMountedCallbacks.size === 0
		) {
			// Listen for input, reset, and submit events
			document.addEventListener('input', handleInput);
			document.addEventListener('reset', handleReset);
			// Capture submit event during the capturing pharse to ensure that the submitter is available
			document.addEventListener('submit', handleSubmit, true);

			// Observe form and input changes
			observer ??= new MutationObserver(handleMutation);
			observer.observe(document.body, {
				subtree: true,
				childList: true,
				attributeFilter: ['form', 'name', 'data-conform'],
			});
		}
	}

	function destroy() {
		// If there are no subscribers left, remove event listeners and disconnect the observer
		if (
			formDataChangedCallbacks.size === 0 &&
			inputMountedCallbacks.size === 0
		) {
			document.removeEventListener('input', handleInput);
			document.removeEventListener('reset', handleReset);
			document.removeEventListener('submit', handleSubmit, true);
			observer?.disconnect();
		}
	}

	return {
		onInputMounted(callback) {
			initialize();
			inputMountedCallbacks.add(callback);

			return () => {
				inputMountedCallbacks.delete(callback);
				destroy();
			};
		},
		onInputChanged(callback) {
			initialize();
			inputChangedCallbacks.add(callback);

			return () => {
				inputChangedCallbacks.delete(callback);
				destroy();
			};
		},
		onFormDataChanged(callback) {
			initialize();
			formDataChangedCallbacks.add(callback);

			return () => {
				formDataChangedCallbacks.delete(callback);
				destroy();
			};
		},
	};
}

export const formObserver = createFormObserver();
