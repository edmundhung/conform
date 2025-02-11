import {
	type Key,
	type RefCallback,
	useRef,
	useState,
	useMemo,
	useEffect,
} from 'react';

export function getFormElement(formId: string): HTMLFormElement | null {
	return document.forms.namedItem(formId);
}

export function getFieldElements(
	form: HTMLFormElement | null,
	name: string,
): Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
	const field = form?.elements.namedItem(name);
	const elements = !field
		? []
		: field instanceof Element
			? [field]
			: Array.from(field.values());

	return elements.filter(
		(
			element,
		): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
			element instanceof HTMLInputElement ||
			element instanceof HTMLSelectElement ||
			element instanceof HTMLTextAreaElement,
	);
}

export function getEventTarget(
	form: HTMLFormElement | null,
	name: string,
	value?: string | string[],
): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
	const elements = getFieldElements(form, name);

	if (elements.length > 1) {
		const options = typeof value === 'string' ? [value] : value;

		for (const element of elements) {
			if (
				typeof options !== 'undefined' &&
				element instanceof HTMLInputElement &&
				element.type === 'checkbox' &&
				(element.checked
					? options.includes(element.value)
					: !options.includes(element.value))
			) {
				continue;
			}

			return element;
		}
	}

	return elements[0] ?? null;
}

export function createDummySelect(
	form: HTMLFormElement,
	name: string,
	value?: string | string[] | undefined,
): HTMLSelectElement {
	const select = document.createElement('select');
	const options = typeof value === 'string' ? [value] : value ?? [];

	select.name = name;
	select.multiple = true;
	select.dataset.conform = 'true';

	// To make sure the input is hidden but still focusable
	select.setAttribute('aria-hidden', 'true');
	select.tabIndex = -1;
	select.style.position = 'absolute';
	select.style.width = '1px';
	select.style.height = '1px';
	select.style.padding = '0';
	select.style.margin = '-1px';
	select.style.overflow = 'hidden';
	select.style.clip = 'rect(0,0,0,0)';
	select.style.whiteSpace = 'nowrap';
	select.style.border = '0';

	for (const option of options) {
		select.options.add(new Option(option, option, true, true));
	}

	form.appendChild(select);

	return select;
}

export function isDummySelect(
	element: HTMLElement,
): element is HTMLSelectElement {
	return element.dataset.conform === 'true';
}

export function updateFieldValue(
	element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
	value: string | string[],
): void {
	if (
		element instanceof HTMLInputElement &&
		(element.type === 'checkbox' || element.type === 'radio')
	) {
		element.checked = Array.isArray(value)
			? value.includes(element.value)
			: element.value === value;
	} else if (element instanceof HTMLSelectElement && element.multiple) {
		const selectedValue = Array.isArray(value) ? [...value] : [value];

		for (const option of element.options) {
			const index = selectedValue.indexOf(option.value);
			const selected = index > -1;

			// Update the selected state of the option
			option.selected = selected;
			// Remove the option from the selected array
			if (selected) {
				selectedValue.splice(index, 1);
			}
		}

		// Add the remaining options to the select element only if it's a dummy element managed by conform
		if (isDummySelect(element)) {
			for (const option of selectedValue) {
				element.options.add(new Option(option, option, false, true));
			}
		}
	} else if (element.value !== value) {
		// No `change` event will be triggered on React if `element.value` is already updated

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
}

export function useInputEvent(): {
	change(value: string | string[]): void;
	focus(): void;
	blur(): void;
	register: RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	>;
} {
	const ref = useRef<
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| null
		| undefined
	>(null);
	const eventDispatched = useRef({
		change: false,
		focus: false,
		blur: false,
	});

	useEffect(() => {
		const createEventListener = (listener: 'change' | 'focus' | 'blur') => {
			return (event: Event) => {
				const element = ref.current;

				if (element && event.target === element) {
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
	}, [ref]);

	return useMemo(() => {
		return {
			change(value) {
				if (!eventDispatched.current.change) {
					eventDispatched.current.change = true;

					const element = ref.current;

					if (element) {
						updateFieldValue(element, value);

						// Dispatch input event with the updated input value
						element.dispatchEvent(new InputEvent('input', { bubbles: true }));
						// Dispatch change event (necessary for select to update the selected option)
						element.dispatchEvent(new Event('change', { bubbles: true }));
					}
				}

				eventDispatched.current.change = false;
			},
			focus() {
				if (!eventDispatched.current.focus) {
					eventDispatched.current.focus = true;

					const element = ref.current;

					if (element) {
						element.dispatchEvent(
							new FocusEvent('focusin', {
								bubbles: true,
							}),
						);
						element.dispatchEvent(new FocusEvent('focus'));
					}
				}

				eventDispatched.current.focus = false;
			},
			blur() {
				if (!eventDispatched.current.blur) {
					eventDispatched.current.blur = true;

					const element = ref.current;

					if (element) {
						element.dispatchEvent(
							new FocusEvent('focusout', {
								bubbles: true,
							}),
						);
						element.dispatchEvent(new FocusEvent('blur'));
					}
				}

				eventDispatched.current.blur = false;
			},
			register(element) {
				ref.current = element;
			},
		};
	}, []);
}

export function useInputValue<
	Value extends string | string[] | Array<string | boolean | Date | undefined>,
>(options: { key?: Key | null | undefined; initialValue?: Value | undefined }) {
	const initializeValue = ():
		| (Value extends string ? Value : string | string[])
		| undefined => {
		if (
			typeof options.initialValue === 'string' ||
			typeof options.initialValue === 'boolean' ||
			options.initialValue instanceof Date
		) {
			// @ts-expect-error FIXME: To ensure that the type of value is also `string | undefined` if initialValue is not an array
			return options.initialValue;
		}

		// @ts-expect-error Same as above
		return options.initialValue?.map((value) => value ?? '');
	};
	const [key, setKey] = useState(options.key);
	const [value, setValue] = useState(initializeValue);

	if (key !== options.key) {
		setValue(initializeValue);
		setKey(options.key);
	}

	return [value, setValue] as const;
}

export function useControl<
	Value extends string | string[] | Array<string | undefined>,
>(meta: { key?: Key | null | undefined; initialValue?: Value | undefined }) {
	const [value, setValue] = useInputValue(meta);
	const { register, change, focus, blur } = useInputEvent();
	const handleChange = (
		value: Value extends string ? Value : string | string[],
	) => {
		setValue(value);
		change(value);
	};

	const refCallback: RefCallback<
		HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | undefined
	> = (element) => {
		register(element);

		if (!element) {
			return;
		}

		const prevKey = element.dataset.conform;
		const nextKey = `${meta.key ?? ''}`;

		if (prevKey !== nextKey) {
			element.dataset.conform = nextKey;
			updateFieldValue(element, value ?? '');
		}
	};

	return {
		register: refCallback,
		value,
		change: handleChange,
		focus,
		blur,
	};
}

export function useInputControl<
	Value extends string | string[] | Array<string | undefined>,
>(meta: {
	key?: Key | null | undefined;
	name: string;
	formId: string;
	initialValue?: Value | undefined;
}) {
	const [value, setValue] = useInputValue(meta);
	const initializedRef = useRef(false);
	const { register, change, focus, blur } = useInputEvent();

	useEffect(() => {
		const form = getFormElement(meta.formId);

		if (!form) {
			// eslint-disable-next-line no-console
			console.warn(
				`useInputControl is unable to find form#${meta.formId} and identify if a dummy input is required`,
			);
			return;
		}

		let element = getEventTarget(form, meta.name);

		if (
			!element &&
			typeof value !== 'undefined' &&
			(!Array.isArray(value) || value.length > 0)
		) {
			element = createDummySelect(form, meta.name, value);
		}

		register(element);

		if (!initializedRef.current) {
			initializedRef.current = true;
		} else {
			change(value ?? '');
		}

		return () => {
			register(null);

			const elements = getFieldElements(form, meta.name);

			for (const element of elements) {
				if (isDummySelect(element)) {
					element.remove();
				}
			}
		};
	}, [meta.formId, meta.name, value, change, register]);

	return {
		value,
		change: setValue,
		focus,
		blur,
	};
}

export function Control<
	Value extends string | string[] | Array<string | undefined>,
>(props: {
	meta: { key?: Key | null | undefined; initialValue?: Value | undefined };
	render: (control: ReturnType<typeof useControl<Value>>) => React.ReactNode;
}) {
	const control = useControl(props.meta);

	return props.render(control);
}
