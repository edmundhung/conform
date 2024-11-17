import {
	RefCallback,
	RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';
import {
	type SubmissionResult,
	type DefaultValue,
	type FormControl,
	type BaseIntent,
	deepEqual,
	syncFormState,
	initializeFormState,
	updateFormState,
	requestControl,
	serializeIntent,
} from './conform-dom';

export function getFormData(event: React.FormEvent<HTMLFormElement>): FormData {
	const submitEvent = event.nativeEvent as SubmitEvent;
	const formData = new FormData(event.currentTarget, submitEvent.submitter);

	return formData;
}

export type FormOptions<
	Schema extends Record<string, unknown>,
	Intent extends BaseIntent,
	ErrorShape,
> = {
	formRef?: RefObject<HTMLFormElement>;
	control?: FormControl<Intent>;
	result?: SubmissionResult<Intent | null, ErrorShape>;
	defaultValue?: DefaultValue<Schema>;
	intentName?: string;
};

export type FormIntent<Intent> = {
	name: string;
	submit(intent: Intent): void;
	serialize(intent: Intent): string;
};

export function useFormState<
	Schema extends Record<string, unknown>,
	Intent extends BaseIntent,
	ErrorShape,
>(options: FormOptions<Schema, Intent, ErrorShape>) {
	const [state, setState] = useState(() => initializeFormState(options));
	const intentName = options.intentName ?? '__intent__';
	const optionsRef = useRef(options);
	const lastResultRef = useRef(options.result);
	const lastStateRef = useRef(state);
	const update = useCallback(
		(result: SubmissionResult<Intent | null, ErrorShape>) => {
			if (result === lastResultRef.current) {
				return;
			}

			lastResultRef.current = result;
			setState((state) =>
				updateFormState(state, {
					defaultValue: optionsRef.current.defaultValue,
					control: optionsRef.current.control,
					result,
				}),
			);
		},
		[],
	);

	useEffect(() => {
		if (options.result) {
			update(options.result);
		}
	}, [options.result, update]);

	useEffect(() => {
		optionsRef.current = options;
		lastStateRef.current = state;
	});

	useEffect(
		() =>
			formObserver.onInputMounted((formElement) => {
				if (formElement === options.formRef?.current) {
					syncFormState(formElement, lastStateRef.current);
				}
			}),
		[],
	);

	useEffect(() => {
		const formElement = options.formRef?.current;

		if (formElement) {
			syncFormState(formElement, state);
		}
	}, [options.formRef, state]);

	return {
		state,
		update,
		intent: {
			name: intentName,
			submit(intent: Intent) {
				requestControl(
					options.formRef?.current,
					intentName,
					serializeIntent(intent),
				);
			},
			serialize(intent: Intent) {
				return serializeIntent(intent);
			},
		},
	};
}

export function useRefQuery<Type>(query: () => Type | null): RefObject<Type> {
	const ref = useRef<Type>(null);
	const queryRef = useRef(query);

	useEffect(() => {
		Object.defineProperty(ref, 'current', {
			get() {
				return queryRef.current();
			},
			set() {
				// eslint-disable-next-line no-console
				console.log('The element ref is immutable');
			},
		});
	}, []);

	useEffect(() => {
		queryRef.current = query;
	}, [query]);

	return ref;
}

type FormReference = string | RefObject<HTMLFormElement>;

function getFormElement(formRef: FormReference): HTMLFormElement | null {
	if (typeof formRef === 'string') {
		return document.forms.namedItem(formRef);
	}

	return formRef.current;
}

export function useFormData<Value>(
	formRef: RefObject<HTMLFormElement> | string,
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

			const snapshot = formObserver.getFormDataSnapshot(formElement);
			const value = select(snapshot, previous.current);

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

export function useInput(initialValue: string): {
	value: string;
	changed(value: string): void;
	focused(): void;
	blurred(): void;
	register: RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
};
export function useInput(initialValue: string[]): {
	value: string[];
	changed(value: string[]): void;
	focused(): void;
	blurred(): void;
	register: RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
};
export function useInput(initialValue?: string | string[]): {
	value: string | string[] | undefined;
	changed(value: string | string[]): void;
	focused(): void;
	blurred(): void;
	register: RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
};
export function useInput(initialValue?: string | string[]) {
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
	onInputMounted(callback: (formElement: HTMLFormElement) => void): () => void;

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

	/**
	 * Retrieves the form data for a given form element.
	 * @param formElement - The form element.
	 * @returns The FormData snapshot.
	 */
	getFormDataSnapshot(formElement: HTMLFormElement): FormData;
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
	const snapshot = new Map<HTMLFormElement, FormData>();

	let observer: MutationObserver | null = null;

	function isInput(
		element: unknown,
	): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
		return (
			element instanceof HTMLInputElement ||
			element instanceof HTMLTextAreaElement ||
			element instanceof HTMLSelectElement
		);
	}

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
		const inputElementMoutned = new Set<HTMLFormElement>();
		const inputElementChanged = new Set<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>();

		for (const mutation of mutations) {
			switch (mutation.type) {
				case 'childList':
					for (const node of mutation.addedNodes) {
						if (isInput(node) && node.form) {
							inputElementMoutned.add(node.form);
							formDataChanged.add(node.form);
						}
					}
					for (const node of mutation.removedNodes) {
						if (isInput(node) && node.form) {
							formDataChanged.add(node.form);
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

		for (const formElement of inputElementMoutned) {
			emitInputMounted(formElement);
		}
	}

	function emitInputMounted(formElement: HTMLFormElement) {
		for (const callback of inputMountedCallbacks) {
			callback(formElement);
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

		snapshot.set(formElement, formData);

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
		getFormDataSnapshot(formElement) {
			let formData = snapshot.get(formElement);

			if (!formData) {
				formData = new FormData(formElement);
				snapshot.set(formElement, formData);
			}

			return formData;
		},
	};
}

export const formObserver = createFormObserver();
