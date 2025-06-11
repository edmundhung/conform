import { useControl } from '@conform-to/react/future';
import { useContext } from 'react';
import {
	Checkbox as AriaCheckbox,
	CheckboxProps as AriaCheckboxProps,
	CheckboxGroupStateContext,
} from 'react-aria-components';

import './Checkbox.css';

export type CheckboxProps = Omit<
	AriaCheckboxProps,
	'isSelected' | 'onChange' | 'inputRef'
>;

export function Checkbox({
	defaultSelected,
	value,
	children,
	...props
}: CheckboxProps) {
	// This makes sure we respect the value set on the CheckboxGroup
	const state = useContext(CheckboxGroupStateContext);
	const control = useControl({
		defaultChecked: state?.value.includes(value ?? '') ?? defaultSelected,
		value,
	});

	return (
		<AriaCheckbox
			{...props}
			ref={(element) => control.register(element?.querySelector('input'))}
			value={value}
			isSelected={control.checked}
			onChange={(checked) => control.change(checked)}
			onBlur={() => control.blur()}
		>
			{({ isIndeterminate }) => (
				<>
					<div className="checkbox">
						<svg viewBox="0 0 18 18" aria-hidden="true">
							{isIndeterminate ? (
								<rect x={1} y={7.5} width={15} height={3} />
							) : (
								<polyline points="1 9 7 14 15 4" />
							)}
						</svg>
					</div>
					{children}
				</>
			)}
		</AriaCheckbox>
	);
}

export { Checkbox as MyCheckbox };
