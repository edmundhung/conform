import {
	DependencyList,
	RefCallback,
	RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	type SubmissionResult,
	type DefaultValue,
	type FormControls,
	deepEqual,
	configure,
	initializeFormState,
	updateFormState,
} from './conform-dom';

export function getFormData(event: React.FormEvent<HTMLFormElement>): FormData {
	const submitEvent = event.nativeEvent as SubmitEvent;
	const formData = new FormData(event.currentTarget, submitEvent.submitter);

	return formData;
}

export function useFormState<Schema, ErrorShape, Intent>(options: {
	formRef?: RefObject<HTMLFormElement>;
	controls?: FormControls<Intent>;
	result?: SubmissionResult<Intent | null, ErrorShape>;
	defaultValue?: DefaultValue<Schema>;
}) {
	const [state, setState] = useState(() => initializeFormState(options));
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
					controls: optionsRef.current.controls,
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

	useEffect(() => {
		const subscriber = getFormSubscriber();
		const unsubscribe = subscriber.subscribe('dom', (formElement) => {
			if (formElement === options.formRef?.current) {
				configure(options.formRef?.current, lastStateRef.current);
			}
		});

		return () => {
			unsubscribe();
		};
	}, []);

	useEffect(() => {
		// To update the form fields based on the current state
		configure(options.formRef?.current, state);
	}, [options.formRef, state]);

	return [state, update] as const;
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

export function useFormData(
	formRef: RefObject<HTMLFormElement>,
): FormData | undefined;
export function useFormData<Value>(
	formRef: RefObject<HTMLFormElement>,
	select: (formData: FormData, currentValue: Value) => Value,
	deps: DependencyList,
): Value | undefined;
export function useFormData<Value>(
	formRef: RefObject<HTMLFormElement>,
	select?: (
		formData: FormData,
		currentValue: Value | FormData | undefined,
	) => Value,
	deps?: DependencyList,
): Value | FormData | undefined {
	const [value, setValue] = useState<Value | FormData>();
	const selectFormData = useCallback(
		select ?? ((formData: FormData) => formData),
		deps ?? [],
	);

	useEffect(() => {
		const updateFormValue = (formData: FormData) => {
			setValue((currentValue) => selectFormData(formData, currentValue));
		};

		const subscriber = getFormSubscriber();
		const unsubscribe = subscriber.subscribe(
			'formData',
			(formElement, formData) => {
				if (formElement === formRef.current) {
					updateFormValue(formData);
				}
			},
		);

		const formElement = formRef.current;

		if (formElement) {
			updateFormValue(new FormData(formElement));
		}

		return () => {
			unsubscribe();
		};
	}, [formRef, selectFormData]);

	return value;
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
	const [value, setValue] = useState(initialValue);
	const eventDispatched = useRef<Record<string, boolean>>({});

	useEffect(() => {
		const deduplicateEvent = (event: Event) => {
			const element = inputRef.current;

			if (element && event.target === element) {
				eventDispatched.current[event.type] = true;
			}
		};
		const updateValue = (
			element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
		) => {
			const isMultipleSelect =
				element instanceof HTMLSelectElement && element.multiple;
			const value = isMultipleSelect
				? Array.from(element.selectedOptions).map((option) => option.value)
				: element.value;

			setValue((prevValue) => {
				const isArray = Array.isArray(prevValue);

				if (isArray && !isMultipleSelect) {
					// eslint-disable-next-line no-console
					console.log('Only multiple select can work with array value');
					return prevValue;
				}

				if (deepEqual(prevValue, value)) {
					return prevValue;
				}

				return value;
			});
		};

		const subscriber = getFormSubscriber();
		const unsubscribe = subscriber.subscribe('input', (element) => {
			if (element === inputRef.current) {
				updateValue(inputRef.current);
			}
		});

		if (inputRef.current) {
			updateValue(inputRef.current);
		}

		return () => {
			unsubscribe();
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

export type FormSubscription =
	| { type: 'dom'; callback: (formElement: HTMLFormElement) => void }
	| {
			type: 'formData';
			callback: (formElement: HTMLFormElement, formData: FormData) => void;
	  }
	| {
			type: 'input';
			callback: (
				inputElement:
					| HTMLInputElement
					| HTMLSelectElement
					| HTMLTextAreaElement,
			) => void;
	  };

export function createFormSubscriber() {
	const subscriptions = new Set<FormSubscription>();
	const observer = new MutationObserver(handleMutation);

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
		if (isInput(event.target)) {
			emitInputChange(event.target);

			if (event.target.form) {
				emitFormDataChange(event.target.form);
			}
		}
	}

	function handleReset(event: Event) {
		if (event.target instanceof HTMLFormElement) {
			emitFormDataChange(event.target);
		}
	}

	function handleSubmit(event: SubmitEvent): void {
		if (event.target instanceof HTMLFormElement) {
			emitFormDataChange(event.target, event.submitter);
		}
	}

	function handleMutation(mutations: MutationRecord[]): void {
		const formElements = new Set<HTMLFormElement>();
		const inputElements = new Set<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>();

		for (const mutation of mutations) {
			if (mutation.target instanceof HTMLFormElement) {
				formElements.add(mutation.target);
			} else if (isInput(mutation.target)) {
				inputElements.add(mutation.target);

				if (mutation.target.form) {
					formElements.add(mutation.target.form);
				}
			}
		}

		for (const formElement of formElements) {
			emitFormDataChange(formElement);
			emitDomChange(formElement);
		}

		for (const inputElement of inputElements) {
			emitInputChange(inputElement);
		}
	}

	function emitFormDataChange(
		formElement: HTMLFormElement,
		submitter?: HTMLElement | null,
	) {
		const formData = new FormData(formElement, submitter);

		for (const subscriber of subscriptions) {
			if (subscriber.type === 'formData') {
				subscriber.callback(formElement, formData);
			}
		}
	}

	function emitDomChange(formElement: HTMLFormElement) {
		for (const subscriber of subscriptions) {
			if (subscriber.type === 'dom') {
				subscriber.callback(formElement);
			}
		}
	}

	function emitInputChange(
		inputElement: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
	) {
		for (const subscriber of subscriptions) {
			if (subscriber.type === 'input') {
				subscriber.callback(inputElement);
			}
		}
	}

	function initialize() {
		document.addEventListener('input', handleInput);
		document.addEventListener('reset', handleReset);
		document.addEventListener('submit', handleSubmit);
		observer.observe(document.body, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['form', 'name', 'data-conform'],
		});
	}

	function disconnect() {
		document.removeEventListener('input', handleInput);
		document.removeEventListener('reset', handleReset);
		document.removeEventListener('submit', handleSubmit);
		observer.disconnect();
	}

	return {
		subscribe<Type extends FormSubscription['type']>(
			type: Type,
			callback: Extract<FormSubscription, { type: Type }>['callback'],
		) {
			if (subscriptions.size === 0) {
				initialize();
			}

			// @ts-expect-error FIXME
			const subscription: FormSubscription = { type, callback };

			subscriptions.add(subscription);

			return () => {
				subscriptions.delete(subscription);

				if (subscriptions.size === 0) {
					disconnect();
				}
			};
		},
	};
}

let formSubscriber: ReturnType<typeof createFormSubscriber> | null = null;

export function getFormSubscriber() {
	if (!formSubscriber) {
		formSubscriber = createFormSubscriber();
	}

	return formSubscriber;
}
