import { type FormResult } from '@conform-to/dom';
import {
	type Schema,
	useFieldset,
	conform,
	useForm,
	parse,
} from '@conform-to/react';
import { Form } from '@remix-run/react';
import { useState } from 'react';
import { Field, Fieldset } from '~/components';
import { useFormConfig } from '~/config';
import { styles } from '~/helpers';

const schema: Schema<{ email: string; password: string; age: string }> = {
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
};

export default function Basic() {
	const [result, setResult] = useState<FormResult<any> | undefined>();
	const [config] = useFormConfig();
	const formProps = useForm({
		...config,
		onSubmit(e) {
			e.preventDefault();

			const formData = new FormData(e.currentTarget);
			const result = parse(formData);

			setResult(result);
		},
	});
	const [fieldsetProps, { email, password, age }] = useFieldset(schema);

	return (
		<Form className={styles.container} {...formProps}>
			<Fieldset
				title="Basic"
				description="React only example"
				result={result}
				{...fieldsetProps}
			>
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
			</Fieldset>
		</Form>
	);
}
