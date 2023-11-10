import { type FieldElement, isFieldElement } from '@conform-to/dom';
import {
	type RefObject,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from 'react';

/**
 * useLayoutEffect is client-only.
 * This basically makes it a no-op on server
 */
const useSafeLayoutEffect =
	typeof document === 'undefined' ? useEffect : useLayoutEffect;

interface InputControl {
	change: (
		eventOrValue: { target: { value: string } } | string | boolean,
	) => void;
	focus: () => void;
	blur: () => void;
}

/**
 * Returns a ref object and a set of helpers that dispatch corresponding dom event.
 *
 * @see https://conform.guide/api/react#useinputevent
 */
export function useInputEvent(options: {
	ref:
		| RefObject<FieldElement>
		| (() => Element | RadioNodeList | FieldElement | null | undefined);
	onInput?: (event: Event) => void;
	onFocus?: (event: FocusEvent) => void;
	onBlur?: (event: FocusEvent) => void;
	onReset?: (event: Event) => void;
}): InputControl {
	const optionsRef = useRef(options);
	const eventDispatched = useRef({
		onInput: false,
		onFocus: false,
		onBlur: false,
	});

	useSafeLayoutEffect(() => {
		optionsRef.current = options;
	});

	useSafeLayoutEffect(() => {
		const createEventListener = (
			listener: Exclude<keyof typeof options, 'ref'>,
		) => {
			return (event: any) => {
				const element =
					typeof optionsRef.current?.ref === 'function'
						? optionsRef.current?.ref()
						: optionsRef.current?.ref.current;

				if (
					isFieldElement(element) &&
					(listener === 'onReset'
						? event.target === element.form
						: event.target === element)
				) {
					if (listener !== 'onReset') {
						eventDispatched.current[listener] = true;
					}

					optionsRef.current?.[listener]?.(event);
				}
			};
		};
		const inputHandler = createEventListener('onInput');
		const focusHandler = createEventListener('onFocus');
		const blurHandler = createEventListener('onBlur');
		const resetHandler = createEventListener('onReset');

		// focus/blur event does not bubble
		document.addEventListener('input', inputHandler, true);
		document.addEventListener('focus', focusHandler, true);
		document.addEventListener('blur', blurHandler, true);
		document.addEventListener('reset', resetHandler);

		return () => {
			document.removeEventListener('input', inputHandler, true);
			document.removeEventListener('focus', focusHandler, true);
			document.removeEventListener('blur', blurHandler, true);
			document.removeEventListener('reset', resetHandler);
		};
	}, []);

	const control = useMemo<InputControl>(() => {
		const dispatch = (
			listener: Exclude<keyof typeof options, 'ref' | 'onReset'>,
			fn: (element: FieldElement) => void,
		) => {
			if (!eventDispatched.current[listener]) {
				const element =
					typeof optionsRef.current?.ref === 'function'
						? optionsRef.current?.ref()
						: optionsRef.current?.ref.current;

				if (!isFieldElement(element)) {
					// eslint-disable-next-line no-console
					console.warn('Failed to dispatch event; is the input mounted?');
					return;
				}

				// To avoid recursion
				eventDispatched.current[listener] = true;
				fn(element);
			}

			eventDispatched.current[listener] = false;
		};

		return {
			change(eventOrValue) {
				dispatch('onInput', (element) => {
					if (
						element instanceof HTMLInputElement &&
						(element.type === 'checkbox' || element.type === 'radio')
					) {
						if (typeof eventOrValue !== 'boolean') {
							throw new Error(
								'You should pass a boolean when changing a checkbox or radio input',
							);
						}

						element.checked = eventOrValue;
					} else {
						if (typeof eventOrValue === 'boolean') {
							throw new Error(
								'You can pass a boolean only when changing a checkbox or radio input',
							);
						}

						const value =
							typeof eventOrValue === 'string'
								? eventOrValue
								: eventOrValue.target.value;

						// No change event will triggered on React if `element.value` is updated
						// before dispatching the event
						if (element.value !== value) {
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

							if (
								prototypeValueSetter &&
								valueSetter !== prototypeValueSetter
							) {
								prototypeValueSetter.call(element, value);
							} else {
								if (valueSetter) {
									valueSetter.call(element, value);
								} else {
									throw new Error(
										'The given element does not have a value setter',
									);
								}
							}
						}
					}

					// Dispatch input event with the updated input value
					element.dispatchEvent(new InputEvent('input', { bubbles: true }));
					// Dispatch change event (necessary for select to update the selected option)
					element.dispatchEvent(new Event('change', { bubbles: true }));
				});
			},
			focus() {
				dispatch('onFocus', (element) => {
					element.dispatchEvent(
						new FocusEvent('focusin', {
							bubbles: true,
						}),
					);
					element.dispatchEvent(new FocusEvent('focus'));
				});
			},
			blur() {
				dispatch('onBlur', (element) => {
					element.dispatchEvent(
						new FocusEvent('focusout', {
							bubbles: true,
						}),
					);
					element.dispatchEvent(new FocusEvent('blur'));
				});
			},
		};
	}, [optionsRef]);

	return control;
}
