import { conform, useForm, parse } from '@conform-to/react';
import { json, type ActionArgs, type LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useRef } from 'react';
import { Playground, Field, Alert } from '~/components';

interface Schema {
	title: string;
	description: string;
	rating: number;
	images: File[];
	tags: string[];
}

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return json({
		enableDescription: url.searchParams.get('enableDescription') === 'yes',
	});
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData);

	return json({
		...submission,
		error: {
			'': 'Submitted',
		},
	});
}

export default function Example() {
	const { enableDescription } = useLoaderData<typeof loader>();
	const lastSubmission = useActionData<typeof action>();
	const ref = useRef<HTMLFormElement>(null);
	const [form, { title, description, images, rating, tags }] = useForm<Schema>({
		id: 'test',
		ref,
		lastSubmission,
		constraint: {
			title: {
				required: true,
				minLength: 1,
				maxLength: 200,
				pattern: '[0-9a-zA-Z ]{1,200}',
			},
			description: {
				required: true,
				minLength: 20,
				maxLength: 1000,
			},
			rating: {
				required: true,
				min: 0.5,
				max: 5,
				step: 0.5,
			},
			images: {
				required: true,
				multiple: true,
			},
			tags: {
				required: true,
				multiple: true,
			},
		},
	});

	if (form.ref !== ref || form.props.ref !== ref) {
		throw new Error('Invalid ref object');
	}

	return (
		<Form method="post" encType="multipart/form-data" {...form.props}>
			<Playground title="Input attributes" lastSubmission={lastSubmission}>
				<Alert id={form.errorid} errors={form.errors} />
				<Field label="Title" config={title}>
					<input
						{...conform.input(title, {
							type: 'text',
							description: enableDescription,
						})}
					/>
				</Field>
				<Field label="Description" config={description}>
					<textarea
						{...conform.textarea(description, {
							description: enableDescription,
						})}
					/>
				</Field>
				<Field label="Image" config={images}>
					<input
						{...conform.input(images, {
							type: 'file',
							description: enableDescription,
						})}
					/>
				</Field>
				<Field label="Tags" config={tags}>
					<select {...conform.select(tags, { description: enableDescription })}>
						<option value="">Please select</option>
						<option value="action">Action</option>
						<option value="adventure">Adventure</option>
						<option value="comedy">Comedy</option>
						<option value="fantasy">Fantasy</option>
						<option value="sci-fi">Science Fiction</option>
						<option value="horror">Horror</option>
						<option value="romance">Romance</option>
					</select>
				</Field>
				<Field label="Rating" config={rating}>
					<input
						{...conform.input(rating, {
							type: 'number',
							description: enableDescription,
						})}
					/>
				</Field>
			</Playground>
		</Form>
	);
}
