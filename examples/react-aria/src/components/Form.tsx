import { Form as RACForm } from 'react-aria-components';
import type { FormProps } from 'react-aria-components';
import './Form.css';

export function Form(props: FormProps) {
	return <RACForm {...props} />;
}
