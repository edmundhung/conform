import { useControl } from '@conform-to/react';
import {
	Button,
	FieldError,
	Label,
	ListBox,
	ListBoxItem,
	ListBoxItemProps,
	Popover,
	Select as AriaSelect,
	SelectProps as AriaSelectProps,
	SelectValue,
	Text,
} from 'react-aria-components';

import './Select.css';

export interface SelectProps<T extends object>
	extends Omit<
		AriaSelectProps<T>,
		'children' | 'defaultSelectedKey' | 'selectedKey'
	> {
	label?: string;
	description?: string;
	defaultValue?: string;
	errors?: string[];
	items?: Iterable<T>;
	children: React.ReactNode | ((item: T) => React.ReactNode);
}

export function Select<T extends object>({
	label,
	name,
	defaultValue,
	description,
	errors,
	children,
	items,
	...props
}: SelectProps<T>) {
	const control = useControl({ defaultValue });

	return (
		<AriaSelect
			{...props}
			selectedKey={control.value ?? null}
			onSelectionChange={(key) => control.change(key.toString())}
		>
			<Label>{label}</Label>
			<Button>
				<SelectValue />
				<span aria-hidden="true">▼</span>
			</Button>
			{description && <Text slot="description">{description}</Text>}
			<FieldError>{errors}</FieldError>
			<Popover>
				<ListBox items={items}>{children}</ListBox>
			</Popover>
			<select
				name={name}
				defaultValue={defaultValue}
				ref={control.register}
				hidden
			>
				<option />
			</select>
		</AriaSelect>
	);
}

export function SelectItem(props: ListBoxItemProps) {
	return <ListBoxItem {...props} />;
}
