import {
	useFieldset,
	conform,
	useForm,
	getFieldElements,
} from '@conform-to/react';
import { Form } from '@remix-run/react';
import { Field, Playground } from '~/components';
import { useFormConfig, useFormResult } from '~/config';
import { styles } from '~/helpers';

export default function Basic() {
	const [result, onSubmit, onReset] = useFormResult();
	const [config] = useFormConfig();
	const nativeFormProps = useForm({ ...config, onSubmit, onReset });
	const customFormProps = useForm({ ...config, onSubmit, onReset });

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Reporting error messages provided by the browser vendor"
				result={result['native']}
				form="native"
			>
				<Form id="native" {...nativeFormProps}>
					<NativeConstraintFieldset />
				</Form>
			</Playground>
			<hr className={styles.divider} />
			<Playground
				title="Custom Constraint"
				description="Setting up custom validation rules with user-defined error messages"
				result={result['custom']}
				form="custom"
			>
				<Form id="custom" {...customFormProps}>
					<CustomValidationFieldset />
				</Form>
			</Playground>
		</>
	);
}

function NativeConstraintFieldset() {
	const [fieldsetProps, { email, password, age }] = useFieldset<{
		email: string;
		password: string;
		age: string;
	}>({
		fields: {
			email: {
				required: true,
			},
			password: {
				required: true,
				minLength: 8,
				maxLength: 20,
				pattern: '[0-9a-zA-Z]{8,20}',
			},
			age: {
				min: '1',
				max: '100',
				step: '10',
			},
		},
	});

	return (
		<fieldset {...fieldsetProps}>
			<Field label="Email" error={email.error}>
				<input
					className={styles.input}
					{...conform.input(email, { type: 'email' })}
				/>
			</Field>
			<Field label="Password" error={password.error}>
				<input
					className={styles.input}
					{...conform.input(password, { type: 'password' })}
				/>
			</Field>
			<Field label="Age" error={age.error}>
				<input
					className={styles.input}
					{...conform.input(age, { type: 'number' })}
				/>
			</Field>
		</fieldset>
	);
}

function CustomValidationFieldset() {
	const [fieldsetProps, { number, accept }] = useFieldset<{
		number: string;
		accept: string;
	}>({
		fields: {
			number: {
				required: true,
				min: '1',
				max: '10',
			},
			accept: {
				required: true,
			},
		},
		validate(element) {
			const [number] = getFieldElements(element, 'number');
			const [accept] = getFieldElements(element, 'accept');

			if (number.validity.valueMissing) {
				number.setCustomValidity('Number is required');
			} else if (
				number.validity.rangeUnderflow ||
				number.validity.rangeOverflow
			) {
				number.setCustomValidity('Number must be between 1 and 10');
			} else if (number.value === '5') {
				number.setCustomValidity('Are you sure?');
			} else {
				number.setCustomValidity('');
			}

			if (accept.validity.valueMissing) {
				accept.setCustomValidity('Please accept before submit');
			} else {
				accept.setCustomValidity('');
			}
		},
	});

	return (
		<fieldset {...fieldsetProps}>
			<Field label="Your lucky number" error={number.error} inline>
				<input
					className={styles.input}
					{...conform.input(number, { type: 'number' })}
				/>
			</Field>
			<Field label="Accept" error={accept.error} inline>
				<input
					className={styles.checkbox}
					{...conform.input(accept, { type: 'checkbox' })}
				/>
			</Field>
		</fieldset>
	);
}
