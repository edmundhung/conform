import {
	Button,
	FieldError,
	Group,
	Input,
	Label,
	NumberField as AriaNumberField,
	NumberFieldProps as AriaNumberFieldProps,
	Text,
} from 'react-aria-components';

import './NumberField.css';
import { useControl } from '@conform-to/react';

export interface NumberFieldProps
	extends Omit<AriaNumberFieldProps, 'defaultValue' | 'value' | 'onChange'> {
	label?: string;
	description?: string;
	defaultValue?: string;
	errors?: string[];
	inputRef?: React.Ref<HTMLInputElement>;
}

export function NumberField({
	label,
	name,
	description,
	defaultValue,
	errors,
	...props
}: NumberFieldProps) {
	const control = useControl({ defaultValue });

	return (
		<AriaNumberField
			{...props}
			value={control.value ? Number(control.value) : undefined}
			onChange={(number) => control.change(number.toString())}
			onBlur={() => control.blur()}
		>
			<Label>{label}</Label>
			<Group>
				<Button slot="decrement">-</Button>
				<Input name={name} ref={control.register} />
				<Button slot="increment">+</Button>
			</Group>
			{description && <Text slot="description">{description}</Text>}
			<FieldError>{errors}</FieldError>
		</AriaNumberField>
	);
}
