import {
	type ForwardedRef,
	type InputHTMLAttributes,
	type RefObject,
	createElement,
	forwardRef,
	useState,
	useRef,
} from 'react';

type BaseInputProps = { name: string } & Omit<
	InputHTMLAttributes<HTMLInputElement>,
	'name' | 'type'
>;
type EventLikeOrString = { target: { value: string } } | string;
type InputControl = {
	defaultValue: string;
	value: string;
	onChange: (value: EventLikeOrString) => void;
	onInput: (value: EventLikeOrString) => void;
	onFocus: () => void;
	onBlur: () => void;
};
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

export function useInputControl(
	ref: RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	config: { defaultValue?: string } = {},
): InputControl {
	const controlled = useRef(false);
	const [value, setValue] = useState(config.defaultValue ?? '');

	function getInputElement():
		| HTMLInputElement
		| HTMLSelectElement
		| HTMLTextAreaElement
		| null {
		const $input = ref.current;

		if (!$input) {
			console.warn(
				'input ref is not available; Maybe you forget to setup the ref?',
			);
		}

		return $input;
	}

	return new Proxy(
		{
			defaultValue: config.defaultValue ?? '',
			value,
			onChange(value: EventLikeOrString) {
				const $input = getInputElement();
				const eventValue =
					typeof value === 'string' ? value : value.target.value;

				if ($input && $input.value !== eventValue) {
					$input.dispatchEvent(
						new InputEvent('beforeinput', { bubbles: true, cancelable: true }),
					);
					setNativeValue($input, eventValue);
					$input.dispatchEvent(
						new InputEvent('input', { bubbles: true, cancelable: true }),
					);

					// Rerender the component when value is changed
					if (controlled.current) {
						setValue(eventValue);
					}
				}
			},
			onInput(value: EventLikeOrString) {
				this.onChange(value);
			},
			onFocus() {
				const $input = getInputElement();

				if ($input) {
					$input.dispatchEvent(
						new FocusEvent('focusin', { bubbles: true, cancelable: true }),
					);
					$input.dispatchEvent(new FocusEvent('focus', { cancelable: true }));
				}
			},
			onBlur() {
				const $input = getInputElement();

				if ($input) {
					$input.dispatchEvent(
						new FocusEvent('focusout', { bubbles: true, cancelable: true }),
					);
					$input.dispatchEvent(new FocusEvent('blur', { cancelable: true }));
				}
			},
		},
		{
			get(target, prop, receiver) {
				if (prop === 'value') {
					controlled.current = true;
				}

				return Reflect.get(target, prop, receiver);
			},
		},
	);
}

function BaseInputImpl(
	{ hidden = true, className, style, ...props }: BaseInputProps,
	ref: ForwardedRef<HTMLInputElement>,
) {
	return createElement('input', {
		ref,
		className: hidden ? '' : className,
		style: hidden
			? {
					position: 'absolute',
					width: '1px',
					height: '1px',
					padding: 0,
					margin: '-1px',
					overflow: 'hidden',
					clip: 'rect(0,0,0,0)',
					whiteSpace: 'nowrap',
					borderWidth: 0,
			  }
			: style,
		...props,
	});
}

export const BaseInput = forwardRef(BaseInputImpl);
