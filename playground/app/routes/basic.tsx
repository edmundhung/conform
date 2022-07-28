import { type Schema, isFieldElement } from '@conform-to/react';
import { Form } from '@remix-run/react';
import {
	type Movie,
	type LoginForm,
	type Checklist,
	type Task,
	MovieFieldset,
	LoginFieldset,
	ChecklistFieldset,
} from '~/fieldset';
import { action, Playground } from '~/playground';

export { action };

export default function Basic() {
	const movieSchema: Schema<Movie> = {
		fields: {
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
		},
	};
	const movieSchemaWithCustomMessage: Schema<Movie> = {
		fields: movieSchema.fields,
		validate(fieldset) {
			for (const element of fieldset.elements) {
				if (!isFieldElement(element)) {
					continue;
				}

				switch (element.name) {
					case 'title': {
						if (element.validity.valueMissing) {
							element.setCustomValidity('Title is required');
						} else if (element.validity.patternMismatch) {
							element.setCustomValidity('Please enter a valid title');
						} else {
							element.setCustomValidity('');
						}
						break;
					}
					case 'description': {
						if (element.validity.tooShort) {
							element.setCustomValidity('Please provides more details');
						} else {
							element.setCustomValidity('');
						}
						break;
					}
					case 'genres': {
						if (element.validity.valueMissing) {
							element.setCustomValidity('Genre is required');
						} else {
							element.setCustomValidity('');
						}
						break;
					}
					case 'rating': {
						if (element.validity.stepMismatch) {
							element.setCustomValidity('The provided rating is invalid');
						} else {
							element.setCustomValidity('');
						}
						break;
					}
				}
			}
		},
	};
	const loginSchema: Schema<LoginForm> = {
		fields: {
			email: {
				required: true,
			},
			password: {
				required: true,
				minLength: 8,
			},
		},
	};
	const checklistSchmea: Schema<Checklist> = {
		fields: {
			title: {
				required: true,
			},
			tasks: {
				required: true,
			},
		},
	};
	const taskSchema: Schema<Task> = {
		fields: {
			content: {
				required: true,
			},
			completed: {},
		},
	};

	return (
		<>
			<Playground
				title="Native Constraint"
				description="Reporting error messages provided by the browser vendor"
				form="native"
			>
				<Form id="native" method="post">
					<MovieFieldset schema={movieSchema} />
				</Form>
			</Playground>
			<Playground
				title="Custom Constraint"
				description="Setting up custom validation rules with user-defined error messages"
				form="custom"
			>
				<Form id="custom" method="post">
					<MovieFieldset schema={movieSchemaWithCustomMessage} />
				</Form>
			</Playground>
			<Playground
				title="Skip Validation"
				description="Disabling validation by using the `noValidate` option"
				form="disable"
			>
				<Form id="disable" method="post" noValidate>
					<LoginFieldset schema={loginSchema} />
				</Form>
			</Playground>
			<Playground
				title="Reporting on submit"
				description="No error would be reported before users try submitting the form"
				form="onsubmit"
			>
				<Form id="onsubmit" method="post">
					<LoginFieldset schema={loginSchema} initialReport="onSubmit" />
				</Form>
			</Playground>
			<Playground
				title="Reporting on change"
				description="Error would be reported once the users type something on the field"
				form="onchange"
			>
				<Form id="onchange" method="post">
					<LoginFieldset schema={loginSchema} initialReport="onChange" />
				</Form>
			</Playground>
			<Playground
				title="Reporting on blur"
				description="Error would not be reported until the users leave the field"
				form="onblur"
			>
				<Form id="onblur" method="post">
					<LoginFieldset schema={loginSchema} initialReport="onBlur" />
				</Form>
			</Playground>
			<Playground
				title="Remote form"
				description="Connecting the form and fieldset using the `form` attribute"
				form="remote"
			>
				<Form id="remote" method="post" />
				<LoginFieldset form="remote" schema={loginSchema} />
			</Playground>
			<Playground
				title="Nested list"
				description="Constructing a nested array using useFieldList"
				form="nested-list"
			>
				<Form id="nested-list" method="post">
					<ChecklistFieldset schema={checklistSchmea} taskSchema={taskSchema} />
				</Form>
			</Playground>
		</>
	);
}
