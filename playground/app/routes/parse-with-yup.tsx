import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithYup } from '@conform-to/yup';
import { type LoaderArgs, type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';
import * as yup from 'yup';

const schema = yup.object({
	username: yup
		.string()
		.required('Username is required')
		.test(
			'test-minlength',
			'Min. 5 characters',
			(username) => !username || username.length > 5,
		)
		.test(
			'test-lowercase',
			'At least 1 lowercase character',
			(username) => !username || username.toUpperCase() !== username,
		)
		.test(
			'test-uppercase',
			'At least 1 uppercase character',
			(username) => !username || username.toLowerCase() !== username,
		)
		.test(
			'test-number',
			'At least 1 number',
			(username) => !username || username.match(/[0-9]/) !== null,
		),
	// isAdmin: yup.bool().required('isAdmin is required'),
	// tags: yup.array().required('Tags is required'),
	// age: yup.number().required('Age is required'),
	// cloud: yup.mixed().required('Cloud is required'),
});

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseWithYup(formData, {
		schema,
	});

	return json(submission.reply());
}

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		onValidate: !noClientValidate
			? ({ formData }) => parseWithYup(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Mutliple Errors" result={lastResult}>
				<Field label="Username" meta={fields.username}>
					<input {...getInputProps(fields.username, { type: 'text' })} />
				</Field>
			</Playground>
		</Form>
	);
}
