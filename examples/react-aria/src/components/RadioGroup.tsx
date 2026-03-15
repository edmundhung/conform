import { useControl } from '@conform-to/react/future';
import {
	FieldError,
	Label,
	RadioGroup as AriaRadioGroup,
	RadioGroupProps as AriaRadioGroupProps,
	Text,
} from 'react-aria-components';

import './RadioGroup.css';

export interface RadioGroupProps
	extends Omit<AriaRadioGroupProps, 'children' | 'defaultValue'> {
	children?: React.ReactNode;
	label: string;
	defaultValue?: string | undefined;
	description?: string;
	errors?: string[];
}

const fieldsetResetStyle: React.CSSProperties = {
	border: 0,
	margin: 0,
	padding: 0,
	minInlineSize: 0,
};

export function RadioGroup({
	label,
	description,
	errors,
	children,
	defaultValue,
	onChange,
	onBlur,
	...props
}: RadioGroupProps) {
	const control = useControl({ defaultValue });

	return (
		<fieldset
			name={props.name}
			ref={control.register}
			style={fieldsetResetStyle}
		>
			<AriaRadioGroup
				{...props}
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
				<Label>{label}</Label>
				{children}
				{description && <Text slot="description">{description}</Text>}
				<FieldError>{errors}</FieldError>
			</AriaRadioGroup>
		</fieldset>
	);
}

export { Radio } from 'react-aria-components';
