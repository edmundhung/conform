import { conform, parse, useForm } from '@conform-to/react';
import { type LoaderArgs, type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useId } from 'react';
import { Playground, Field } from '~/components';

interface Schema {
	answers: string[];
}

function parseForm(formData: FormData) {
	return parse<Schema>(formData, {
		resolve({ answers }) {
			const error: Partial<Record<keyof Schema, string>> = {};

			if (!answers) {
				error.answers = 'Required';
			}

			if (error.answers) {
				return { error };
			}

			return {
				value: {
					answers,
				},
			};
		},
	});
}

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		noClientValidate: url.searchParams.get('noClientValidate') === 'yes',
	};
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parseForm(formData);

	return json(submission);
}

const options = {
	a: 'A',
	b: 'B',
	c: 'C',
	d: 'D',
};

export default function Example() {
	const id = useId();
	const { noClientValidate } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const [form, fields] = useForm<Schema>({
		id,
		lastSubmission,
		defaultValue: {
			answers: [],
		},
		onValidate: !noClientValidate
			? ({ formData }) => parseForm(formData)
			: undefined,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Attributes" lastSubmission={lastSubmission}>
				<Field label="Multiple Choice" config={fields.answers}>
					{conform
						.collection(fields.answers, {
							type: 'checkbox',
							values: Object.keys(options),
						})
						.map((option) => (
							<label key={option.value}>
								<input {...option} />
								<span className="p-2">
									{options[option.value as keyof typeof options]}
								</span>
							</label>
						))}
				</Field>
			</Playground>
		</Form>
	);
}
