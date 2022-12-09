import React, {
	type ForwardedRef,
	type InputHTMLAttributes,
	forwardRef,
	useRef,
	useEffect,
	useLayoutEffect,
	useImperativeHandle,
} from 'react';

/**
 * useLayoutEffect is client-only.
 * This basically makes it a no-op on server
 */
const useSafeLayoutEffect =
	typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Triggering react custom change event
 * Solution based on dom-testing-library
 * @see https://github.com/facebook/react/issues/10135#issuecomment-401496776
 * @see https://github.com/testing-library/dom-testing-library/blob/main/src/events.js#L104-L123
 */
function setNativeValue(element: HTMLInputElement, value: string) {
	if (element.value === value) {
		// It will not trigger a change event if `element.value` is the same as the set value
		return;
	}

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

/**
 * Style to make the input element visually hidden
 * Based on the `sr-only` class from tailwindcss
 */
const hiddenStyle: React.CSSProperties = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: 0,
	margin: '-1px',
	overflow: 'hidden',
	clip: 'rect(0,0,0,0)',
	whiteSpace: 'nowrap',
	borderWidth: 0,
};

export interface BaseInputProps
	extends Omit<
		InputHTMLAttributes<HTMLInputElement>,
		'name' | 'value' | 'defaultValue' | 'onReset'
	> {
	name: string;
	value: string;

	/**
	 * A reset event handler
	 * This will be called if user clicks on a reset button
	 * or calls reset() API on the HTMLFormElement
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reset_event
	 */
	onReset?: (event: Event) => void;
}

export const BaseInput = forwardRef(function BaseInput(
	props: BaseInputProps,
	forwardedRef: ForwardedRef<HTMLInputElement>,
) {
	const ref = useRef<HTMLInputElement>(null);
	const propsRef = useRef(props);

	const {
		hidden = true,
		tabIndex = -1,
		className,
		style,
		onChange,
		onReset,
		...inputProps
	} = props;

	useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(
		forwardedRef,
		() => {
			const $input = ref.current;

			if (!$input) {
				return null;
			}

			return new Proxy($input, {
				get(target, prop, receiver) {
					switch (prop) {
						case 'focus':
							setTimeout(() => {
								target.dispatchEvent(
									new FocusEvent('focusin', {
										bubbles: true,
										cancelable: true,
									}),
								);
								target.dispatchEvent(
									new FocusEvent('focus', { cancelable: true }),
								);
							}, 0);
							break;
						case 'blur':
							setTimeout(() => {
								$input.dispatchEvent(
									new FocusEvent('focusout', {
										bubbles: true,
										cancelable: true,
									}),
								);
								$input.dispatchEvent(
									new FocusEvent('blur', { cancelable: true }),
								);
							}, 0);
							break;
						default:
							return Reflect.get(target, prop, receiver);
					}
				},
			});
		},
	);

	useSafeLayoutEffect(() => {
		const handleReset = (event: Event) => {
			if (event.target === ref.current?.form) {
				propsRef.current.onReset?.(event);
			}
		};

		document.addEventListener('reset', handleReset);

		return () => {
			document.removeEventListener('reset', handleReset);
		};
	}, []);

	useSafeLayoutEffect(() => {
		const $input = ref.current;

		if (!$input || !hidden) {
			return;
		}

		const value = $input.value;

		$input.value = propsRef.current.value;
		$input.dispatchEvent(
			new InputEvent('beforeinput', { bubbles: true, cancelable: true }),
		);
		setNativeValue($input, value);
		$input.dispatchEvent(
			new InputEvent('input', { bubbles: true, cancelable: true }),
		);
	}, [props.value, hidden]);

	useSafeLayoutEffect(() => {
		propsRef.current = props;
	});

	return (
		<input
			ref={ref}
			className={!hidden ? className : ''}
			style={!hidden ? style : hiddenStyle}
			onChange={onChange ?? (() => {})}
			tabIndex={tabIndex}
			{...inputProps}
		/>
	);
});
