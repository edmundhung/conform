import {
	ListBox as AriaListBox,
	ListBoxItem as AriaListBoxItem,
} from 'react-aria-components';
import type { ListBoxItemProps, ListBoxProps } from 'react-aria-components';

import './ListBox.css';

export function ListBox<T extends object>({
	children,
	...props
}: ListBoxProps<T>) {
	return <AriaListBox {...props}>{children}</AriaListBox>;
}

export function ListBoxItem(props: ListBoxItemProps) {
	return <AriaListBoxItem {...props} />;
}
