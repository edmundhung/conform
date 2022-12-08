import React, {
	type ForwardedRef,
	type InputHTMLAttributes,
	forwardRef,
	useRef,
	useEffect,
	useLayoutEffect,
	useImperativeHandle,
} from 'react';

const useSafeLayoutEffect =
	typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Triggering react custom change event
 * Solution based on dom-testing-library
 * @see https://github.com/facebook/react/issues/10135#issuecomment-401496776
 * @see https://github.com/testing-library/dom-testing-library/blob/main/src/events.js#L104-L123
 */
function setNativeValue(element: HTMLElement, value: string) {
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
		onFocus,
		onBlur,
		onFocusCapture,
		onBlurCapture,
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

			return {
				...$input,
				focus() {
					setTimeout(() => {
						$input.dataset.mode = 'manual';
						$input.dispatchEvent(
							new FocusEvent('focusin', { bubbles: true, cancelable: true }),
						);
						$input.dispatchEvent(new FocusEvent('focus', { cancelable: true }));
						delete $input.dataset.mode;
					}, 0);
				},
				blur() {
					setTimeout(() => {
						$input.dataset.mode = 'manual';
						$input.dispatchEvent(
							new FocusEvent('focusout', { bubbles: true, cancelable: true }),
						);
						$input.dispatchEvent(new FocusEvent('blur', { cancelable: true }));
						delete $input.dataset.mode;
					}, 0);
				},
			};
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
			onFocusCapture={(event) => {
				if (event.target.dataset.mode !== 'manual') {
					onFocusCapture?.(event);
				}
			}}
			onFocus={(event) => {
				if (event.target.dataset.mode !== 'manual') {
					onFocus?.(event);
				}
			}}
			onBlurCapture={(event) => {
				if (event.target.dataset.mode !== 'manual') {
					onBlurCapture?.(event);
				}
			}}
			onBlur={(event) => {
				if (event.target.dataset.mode !== 'manual') {
					onBlur?.(event);
				}
			}}
			tabIndex={tabIndex}
			{...inputProps}
		/>
	);
});
