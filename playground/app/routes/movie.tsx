import type { FieldsetConstraint } from '@conform-to/react';
import {
	conform,
	isFieldElement,
	parse,
	useFieldset,
	useForm,
} from '@conform-to/react';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

interface Movie {
	title: string;
	description?: string;
	genre: string;
	rating?: number;
}

const constraint: FieldsetConstraint<Movie> = {
	title: {
		required: true,
		pattern: '[0-9a-zA-Z ]{1,20}',
	},
	description: {
		minLength: 30,
		maxLength: 200,
	},
	genre: {
		required: true,
		/**
		 * No value from multiple select will be included in the FormData
		 * when nothing is selected. This makes it hard to know the field
		 * exist and add it to part of the scope. As native select is
		 * uncommon (especially with `multiple`) due to lack of customization
		 * capablity. This is considered a limitation for now.
		 */
		// multiple: true,
	},
	rating: {
		min: '0.5',
		max: '5',
		step: '0.5',
	},
};

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData);

	if (submission.value.title === '') {
		submission.error.push(['title', 'Title is required']);
	} else if (!`${submission.value.title}`.match(/[0-9a-zA-Z ]{1,20}/)) {
		submission.error.push(['title', 'Please enter a valid title']);
	}

	if (
		submission.value.description !== '' &&
		`${submission.value.description}`.length < 30
	) {
		submission.error.push(['description', 'Please provides more details']);
	}

	if (submission.value.genre === '') {
		submission.error.push(['genre', 'Genre is required']);
	}

	if (
		typeof submission.value.rating === 'string' &&
		Number(submission.value.rating) % 0.5 !== 0
	) {
		submission.error.push(['rating', 'The provided rating is invalid']);
	}

	return submission;
};

export default function MovieForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<Movie>({
		...config,
		state,
		onValidate: config.validate
			? ({ form, submission }) => {
					for (const field of form.elements) {
						if (
							isFieldElement(field) &&
							submission.scope.includes(field.name)
						) {
							switch (field.name) {
								case 'title':
									if (field.validity.valueMissing) {
										field.setCustomValidity('Title is required');
									} else if (field.validity.patternMismatch) {
										field.setCustomValidity('Please enter a valid title');
									} else {
										field.setCustomValidity('');
									}
									break;
								case 'description':
									if (field.validity.tooShort) {
										field.setCustomValidity('Please provides more details');
									} else {
										field.setCustomValidity('');
									}
									break;
								case 'genre':
									if (field.validity.valueMissing) {
										field.setCustomValidity('Genre is required');
									} else {
										field.setCustomValidity('');
									}
									break;
								case 'rating':
									if (field.validity.stepMismatch) {
										field.setCustomValidity('The provided rating is invalid');
									} else {
										field.setCustomValidity('');
									}
									break;
							}
						}
					}

					return form.reportValidity();
			  }
			: undefined,
		onSubmit(event, { submission }) {
			switch (submission.type) {
				case 'validate': {
					event.preventDefault();
					break;
				}
			}
		},
	});
	const { title, description, genre, rating } = useFieldset<Movie>(form.ref, {
		...form.config,
		constraint,
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Movie Form" formState={state}>
				<fieldset>
					<Field label="Title" error={title.error}>
						<input {...conform.input(title.config, { type: 'text' })} />
					</Field>
					<Field label="Description" error={description.error}>
						<textarea {...conform.textarea(description.config)} />
					</Field>
					<Field label="Genre" error={genre.error}>
						<select {...conform.select(genre.config)}>
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
					<Field label="Rating" error={rating.error}>
						<input {...conform.input(rating.config, { type: 'number' })} />
					</Field>
				</fieldset>
			</Playground>
		</Form>
	);
}
