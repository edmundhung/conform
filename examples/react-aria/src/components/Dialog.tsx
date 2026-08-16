import { Dialog as RACDialog } from 'react-aria-components';
import type { DialogProps } from 'react-aria-components';
import './Dialog.css';

export function Dialog(props: DialogProps) {
	return <RACDialog {...props} />;
}
