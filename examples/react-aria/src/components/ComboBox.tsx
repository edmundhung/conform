import { useControl } from '@conform-to/react';
import {
	Button,
	ComboBox as AriaComboBox,
	ComboBoxProps as AriaComboBoxProps,
	FieldError,
	Input,
	Label,
	ListBox,
	ListBoxItem,
	ListBoxItemProps,
	Popover,
	Text,
} from 'react-aria-components';

import './ComboBox.css';

export interface ComboBoxProps<T extends object>
	extends Omit<AriaComboBoxProps<T>, 'children'> {
	label?: string;
	description?: string | null;
	errors?: string[];
	children: React.ReactNode | ((item: T) => React.ReactNode);
}

export function ComboBox<T extends object>({
	label,
	name,
	defaultInputValue,
	description,
	errors,
	children,
	...props
}: ComboBoxProps<T>) {
	const control = useControl({ defaultValue: defaultInputValue });

	return (
		<AriaComboBox {...props} onInputChange={(value) => control.change(value)}>
			<Label>{label}</Label>
			<div className="my-combobox-container">
				<Input />
				<Button>▼</Button>
			</div>
			{description && <Text slot="description">{description}</Text>}
			<FieldError>{errors}</FieldError>
			<input
				name={name}
				defaultValue={defaultInputValue}
				ref={control.register}
				hidden
			/>
			<Popover>
				<ListBox>{children}</ListBox>
			</Popover>
		</AriaComboBox>
	);
}

export function ComboBoxItem(props: ListBoxItemProps) {
	return <ListBoxItem {...props} />;
}
