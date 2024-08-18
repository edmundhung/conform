import {
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
	type Form,
	type FormControl,
	type FormIntent,
	type DefaultValue,
	getInput,
	deepEqual,
	configure,
} from './conform-dom';

export function getFormData(event: React.FormEvent<HTMLFormElement>): FormData {
	const submitEvent = event.nativeEvent as SubmitEvent;
	const formData = new FormData(event.currentTarget, submitEvent.submitter);

	return formData;
}

export function useFormState<
	Controls extends Record<string, FormControl<any>>,
	Schema,
	ErrorShape,
>(
	form: Form<Controls>,
	options: {
		formRef?: RefObject<HTMLFormElement>;
		result?: SubmissionResult<FormIntent<Controls> | null, ErrorShape>;
		defaultValue?: DefaultValue<Schema>;
	},
) {
	const [state, setState] = useState(() => form.initialize(options));
	const optionsRef = useRef(options);
	const lastResultRef = useRef(options.result);
	const update = useCallback(
		(result: SubmissionResult<FormIntent<Controls> | null, ErrorShape>) => {
			if (result === lastResultRef.current) {
				return;
			}

			lastResultRef.current = result;
			setState((state) =>
				form.update(state, {
					defaultValue: optionsRef.current.defaultValue,
					result,
				}),
			);
		},
		[],
	);

	useEffect(() => {
		optionsRef.current = options;
	});

	useEffect(() => {
		if (options.result) {
			update(options.result);
		}
	}, [options.result, update]);

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

export function useFormData<Value>(
	formRef: RefObject<HTMLFormElement>,
	select?: (formData: FormData, currentValue: Value) => Value,
): Value | undefined {
	const [value, setValue] = useState<Value>();

	useEffect(() => {
		const updateFormValue = (formElement: HTMLFormElement) => {
			const formData = new FormData(formElement);

			// @ts-expect-error When select is undefined, the value is always FormData
			setValue((currentValue) => select?.(formData, currentValue) ?? formData);
		};
		const handleFormEvent = (event: Event) => {
			const formElement = formRef.current;

			if (!formElement) {
				return;
			}

			if (event.target === formElement || getInput(event.target, formElement)) {
				updateFormValue(formElement);
			}
		};

		const observer = new MutationObserver((mutations) => {
			const formElement = formRef.current;

			if (!formElement) {
				return;
			}

			for (const mutation of mutations) {
				const nodes =
					mutation.type === 'childList'
						? [...mutation.addedNodes, ...mutation.removedNodes]
						: [mutation.target];

				for (const node of nodes) {
					if (getInput(node, formElement)) {
						updateFormValue(formElement);
						return;
					}
				}
			}
		});

		observer.observe(document.body, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['form', 'name', 'data-conform'],
		});

		document.addEventListener('input', handleFormEvent);
		document.addEventListener('reset', handleFormEvent);
		document.addEventListener('submit', handleFormEvent);

		const formElement = formRef.current;

		if (formElement) {
			updateFormValue(formElement);
		}

		return () => {
			observer.disconnect();

			document.removeEventListener('input', handleFormEvent);
			document.removeEventListener('reset', handleFormEvent);
			document.removeEventListener('submit', handleFormEvent);
		};
	}, [formRef, select]);

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

export function useCustomInput(initialValue: string): {
	value: string;
	change(value: string): void;
	focus(): void;
	blur(): void;
	register: RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
};
export function useCustomInput(initialValue: string[]): {
	value: string[];
	change(value: string[]): void;
	focus(): void;
	blur(): void;
	register: RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
};
export function useCustomInput(initialValue: string | string[]) {
	const inputRef = useRef<
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| null
		| undefined
	>();
	const observerRef = useRef<MutationObserver | null>(null);
	const [value, setValue] = useState(initialValue);
	const eventDispatched = useRef<Record<string, boolean>>({});

	useEffect(() => {
		const deduplicateEvent = (event: Event) => {
			const element = inputRef.current;

			if (element && event.target === element) {
				eventDispatched.current[event.type] = true;
			}
		};
		const updateValue = () => {
			const element = inputRef.current;

			if (element) {
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
			}
		};

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.target === inputRef.current) {
					updateValue();
					return;
				}
			}
		});

		if (inputRef.current) {
			observer.observe(inputRef.current, {
				attributes: true,
				attributeFilter: ['data-conform'],
			});
			updateValue();
		}

		observerRef.current = observer;
		document.addEventListener('input', updateValue);
		document.addEventListener('focusin', deduplicateEvent, true);
		document.addEventListener('focusout', deduplicateEvent, true);

		return () => {
			observer.disconnect();
			observerRef.current = null;
			document.removeEventListener('input', updateValue);
			document.removeEventListener('focusin', deduplicateEvent, true);
			document.removeEventListener('focusout', deduplicateEvent, true);
		};
	}, []);

	const control = useMemo<{
		change(value: string | string[]): void;
		focus(): void;
		blur(): void;
		register: RefCallback<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
		>;
	}>(() => {
		return {
			register(element) {
				inputRef.current = element;

				if (!observerRef.current) {
					return;
				}

				observerRef.current.disconnect();

				if (element) {
					observerRef.current.observe(element, {
						attributes: true,
						attributeFilter: ['data-conform'],
					});
				}
			},
			change(value) {
				const element = inputRef.current;

				if (element) {
					updateFieldValue(element, value);
				}
			},
			focus() {
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
			blur() {
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
		change: control.change,
		focus: control.focus,
		blur: control.blur,
		register: control.register,
	};
}
