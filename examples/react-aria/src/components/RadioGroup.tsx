import { useControl } from '@conform-to/react/future';
import {
	FieldError,
	Label,
	RadioGroup as AriaRadioGroup,
	RadioGroupProps as AriaRadioGroupProps,
	Text,
} from 'react-aria-components';

import './RadioGroup.css';

export interface RadioGroupProps extends Omit<
	AriaRadioGroupProps,
	'children' | 'defaultValue'
> {
	children?: React.ReactNode;
	label?: string;
	defaultValue?: string | undefined;
	description?: string;
	errors?: string[];
}

export function RadioGroup({
	label,
	description,
	errors,
	children,
	defaultValue,
	onBlur,
	onChange,
	...props
}: RadioGroupProps) {
	const control = useControl({ defaultValue });

	return (
		<AriaRadioGroup
			{...props}
			ref={(wrapper) => control.register(wrapper?.querySelectorAll('input'))}
			value={control.value ?? null}
			onChange={(value) => {
				control.change(value);
				onChange?.(value);
			}}
			onBlur={(event) => {
				control.blur();
				onBlur?.(event);
			}}
		>
			{label ? <Label>{label}</Label> : null}
			{children}
			{description && <Text slot="description">{description}</Text>}
			<FieldError>{errors}</FieldError>
		</AriaRadioGroup>
	);
}

export { Radio } from 'react-aria-components';
