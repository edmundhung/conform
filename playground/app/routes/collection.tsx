import { getCollectionProps, getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import {
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
	json,
} from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	singleChoice: z.string({ message: 'Required' }),
	multipleChoice: z
		.enum(['a', 'b', 'c'], {
			error(issue) {
				if (issue.code === 'invalid_value') {
					return { message: 'Invalid' };
				}

				return issue.message ? { message: issue.message } : null;
			},
		})
		.array()
		.min(1, 'Required'),
});

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	return json(submission.reply());
}

export default function Example() {
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		id: 'collection',
		lastResult,
		shouldRevalidate: 'onInput',
		onValidate: !noClientValidate
			? ({ formData }) => parseWithZod(formData, { schema })
			: undefined,
	});

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Collection" result={lastResult}>
				<Field label="Single choice" meta={fields.singleChoice}>
					{getCollectionProps(fields.singleChoice, {
						type: 'radio',
						options: ['x', 'y', 'z'],
					}).map((props) => (
						<label key={props.value} className="inline-block">
							<input {...props} />
							<span className="p-2">{props.value?.toUpperCase()}</span>
						</label>
					))}
				</Field>
				<Field label="Multiple choice" meta={fields.multipleChoice} allErrors>
					{getCollectionProps(fields.multipleChoice, {
						type: 'checkbox',
						options: ['a', 'b', 'c', 'd'],
					}).map((props) => (
						<label key={props.value} className="inline-block">
							<input {...props} />
							<span className="p-2">{props.value?.toUpperCase()}</span>
						</label>
					))}
				</Field>
			</Playground>
		</Form>
	);
}
