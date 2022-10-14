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
	genres: string[];
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
	genres: {
		required: true,
		multiple: true,
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
	const [state] = parse(formData);

	if (typeof state.value.title !== 'string') {
		state.error.push(['title', 'Title is required']);
	} else if (!state.value.title.match(/[0-9a-zA-Z ]{1,20}/)) {
		state.error.push(['title', 'Please enter a valid title']);
	}

	if (
		typeof state.value.description === 'string' &&
		state.value.description.length < 30
	) {
		state.error.push(['description', 'Please provides more details']);
	}

	if (typeof state.value.genres !== 'string') {
		state.error.push(['genres', 'Genre is required']);
	}

	if (
		typeof state.value.rating === 'string' &&
		Number(state.value.rating) % 0.5 !== 0
	) {
		state.error.push(['rating', 'The provided rating is invalid']);
	}

	return state;
};

export default function MovieForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<Movie>({
		...config,
		state,
		validate: config.validate
			? ({ form }) => {
					for (const field of form.elements) {
						if (isFieldElement(field)) {
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
								case 'genres':
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
			  }
			: undefined,
		onSubmit(event, action) {
			switch (action?.name) {
				case 'validate': {
					event.preventDefault();
					break;
				}
			}
		},
	});
	const { title, description, genres, rating } = useFieldset<Movie>(form.ref, {
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
					<Field label="Genres" error={genres.error}>
						<select {...conform.select(genres.config)}>
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
