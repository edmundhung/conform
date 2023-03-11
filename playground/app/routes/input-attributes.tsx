import { conform, useForm, parse } from '@conform-to/react';
import { json, type ActionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { Playground, Field, Alert } from '~/components';

interface Schema {
	title: string;
	description: string;
	rating: number;
	images: File[];
	tags: string[];
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
	const state = useActionData<typeof action>();
	const [form, { title, description, images, rating, tags }] = useForm<Schema>({
		id: 'test',
		state,
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

	return (
		<Form method="post" encType="multipart/form-data" {...form.props}>
			<Playground title="Input attributes" state={state}>
				<Alert message={form.error} />
				<Field label="Title" config={title}>
					<input {...conform.input(title, { type: 'text' })} />
				</Field>
				<Field label="Description" config={description}>
					<textarea {...conform.textarea(description)} />
				</Field>
				<Field label="Image" config={images}>
					<input {...conform.input(images, { type: 'file' })} />
				</Field>
				<Field label="Tags" config={tags}>
					<select {...conform.select(tags)}>
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
					<input {...conform.input(rating, { type: 'number' })} />
				</Field>
			</Playground>
		</Form>
	);
}
