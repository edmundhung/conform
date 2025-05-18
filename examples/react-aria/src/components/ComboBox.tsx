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
import { useRef } from 'react';

export interface ComboBoxProps<T extends object>
	extends Omit<AriaComboBoxProps<T>, 'children'> {
	label?: string;
	description?: string | null;
	defaultValue?: string;
	errors?: string[];
	children: React.ReactNode | ((item: T) => React.ReactNode);
}

export function ComboBox<T extends object>({
	label,
	name,
	defaultValue,
	description,
	errors,
	children,
	...props
}: ComboBoxProps<T>) {
	const ref = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			ref.current?.focus();
		},
	});

	return (
		<>
			<input name={name} ref={control.register} hidden />
			<AriaComboBox
				{...props}
				inputValue={control.value ?? ''}
				onInputChange={(value) => control.change(value)}
			>
				<Label>{label}</Label>
				<div className="my-combobox-container">
					<Input ref={ref} />
					<Button>▼</Button>
				</div>
				{description && <Text slot="description">{description}</Text>}
				<FieldError>{errors}</FieldError>
				<Popover>
					<ListBox>{children}</ListBox>
				</Popover>
			</AriaComboBox>
		</>
	);
}

export function ComboBoxItem(props: ListBoxItemProps) {
	return <ListBoxItem {...props} />;
}
