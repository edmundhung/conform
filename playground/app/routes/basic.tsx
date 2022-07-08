import { useFieldset, conform, useForm } from '@conform-to/react';
import { resolve, parse } from '@conform-to/zod';
import { type ActionFunction } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { Field, Fieldset } from '~/components';
import { useFormConfig } from '~/config';
import { styles } from '~/helpers';

const schema = z.object({
	date: z.string(),
	datetime: z.string(),
	email: z.string(),
	number: z.string(),
	password: z.string(),
	search: z.string(),
	text: z.string(),
	time: z.string(),
	url: z.string(),
});

export let action: ActionFunction = async ({ request }) => {
	const formData = await request.formData();
	const formResult = parse(formData, schema);

	return formResult;
};

export default function Basic() {
	const [config, action] = useFormConfig();
	const formState = useActionData();
	const formProps = useForm(config);
	const [
		fieldsetProps,
		{ date, datetime, email, number, password, search, text, time, url },
	] = useFieldset(resolve(schema), formState);

	return (
		<Form
			method="post"
			action={action}
			className={styles.container}
			{...formProps}
		>
			<Fieldset
				title="Basic"
				description="Different input fields"
				result={formState}
				{...fieldsetProps}
			>
				<Field label="date" error={date.error}>
					<input
						className={styles.input}
						{...conform.input(date, { type: 'date' })}
					/>
				</Field>
				<Field label="datetime" error={datetime.error}>
					<input
						className={styles.input}
						{...conform.input(datetime, { type: 'datetime-local' })}
					/>
				</Field>
				<Field label="email" error={email.error}>
					<input
						className={styles.input}
						{...conform.input(email, { type: 'email' })}
					/>
				</Field>
				<Field label="number" error={number.error}>
					<input
						className={styles.input}
						{...conform.input(number, { type: 'number' })}
					/>
				</Field>
				<Field label="password" error={password.error}>
					<input
						className={styles.input}
						{...conform.input(password, { type: 'password' })}
					/>
				</Field>
				<Field label="search" error={search.error}>
					<input
						className={styles.input}
						{...conform.input(search, { type: 'search' })}
					/>
				</Field>
				<Field label="text" error={text.error}>
					<input
						className={styles.input}
						{...conform.input(text, { type: 'text' })}
					/>
				</Field>
				<Field label="time" error={time.error}>
					<input
						className={styles.input}
						{...conform.input(time, { type: 'time' })}
					/>
				</Field>
				<Field label="url" error={url.error}>
					<input
						className={styles.input}
						{...conform.input(url, { type: 'url' })}
					/>
				</Field>
			</Fieldset>
		</Form>
	);
}
