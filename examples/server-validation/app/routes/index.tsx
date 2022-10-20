import type { Submission } from '@conform-to/react';
import {
	conform,
	parse,
	useFieldset,
	useForm,
	hasError,
	shouldValidate,
	setFormError,
} from '@conform-to/react';
import { getError } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

/**
 * Some changes on the parsing logic that will affect your zod schema:
 *
 * Before v0.4, empty field value are removed from the form data before passing to the schema
 * This allows empty string being treated as `undefiend` by zod to utilise `required_error`
 * e.g. `z.string({ required_error: 'Required' })`
 *
 * However, due to my lack of experience with zod, this introduced an unexpected behaviour
 * which stop the schema from running `.refine()` calls until all the defined fields are filled with at least 1 characters
 *
 * In short, please use `z.string().min(1, 'Required')` instead of `z.string({ required_error: 'Required' })` now
 */
const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().min(1, 'Email is required').email('Email is invalid'),
	title: z.string().min(1, 'Title is required').max(20, 'Title is too long'),
});

type Schema = z.infer<typeof schema>;

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();

	/**
	 * The `schema.parse(formData: FormData)` helper is no longer available.
	 * Instead, you need to use `parse(formData: FormData)` to find out the submission details.
	 * It includes:
	 * (1) `submission.value`: Structured form value based on the name (path)
	 * (2) `submission.error`: Error (if any) while parsing the FormData object,
	 * (3) `submission.type` : Type of the submission.
	 * 		Set only when the user click on named button with pattern (`conform/${type}`),
	 * 		e.g. `validate`
	 */
	const submission = parse(formData);
	const result = await schema
		// Async validation. e.g. checking uniqueness
		.refine(
			async (employee) =>
				new Promise((resolve) => {
					setTimeout(() => {
						resolve(employee.email === 'hey@conform.guide');
					}, Math.random() * 100);
				}),
			{
				message: 'Email is already used',
				path: ['email'],
			},
		)
		.safeParseAsync(submission.value);

	// Return the state to the client if the submission is made for validation purpose
	if (!result.success || submission.type === 'validate') {
		return json({
			value: submission.value,
			error: submission.error.concat(getError(result)),
		});
	}

	console.log('Result:', result.data);

	return redirect('/');
};

export default function EmployeeForm() {
	// Last submission returned from the server
	const state = useActionData<Submission<Schema>>();

	/**
	 * The useForm hook now returns a `Form` object
	 * It includes:
	 * (1) form.props: Properties to be passed to the form element
	 * (2) form.config: Fieldset config to be passed to the useFieldset hook.
	 * 	   [Optional] Needed only if the fields have default value / nojs support is needed)
	 * (3) form.ref: Ref object of the form element. Same as `form.props.ref`
	 * (4) form.error: Form error. Set when an error with an empty string name is provided.
	 */
	const form = useForm<Schema>({
		// Enable server validation mode
		mode: 'server-validation',

		// Begin validating on blur
		initialReport: 'onBlur',

		// Just hook it up with the result from useActionData()
		state,

		/**
		 * The validate hook - `onValidate(context: FormContext): boolean`
		 * Changes includes:
		 *
		 * (1) Renamed from `validate` to `onValidate`
		 * (2) Changed the function signature with a new context object, including `form`, `formData` and `submission`
		 * (3) It should now returns a boolean indicating if the server validation is needed
		 *
		 * If both `onValidate` and `onSubmit` are commented out, then it will validate the form completely by server validation
		 */
		onValidate({ form, submission }) {
			// Similar to server validation without the extra refine()
			const result = schema.safeParse(submission.value);

			if (!result.success) {
				submission.error = submission.error.concat(getError(result.error));
			}

			if (
				shouldValidate(submission, 'email') &&
				!hasError(submission.error, 'email')
			) {
				// Skip reporting client error
				throw form;
			}

			/**
			 * Set the submission error to the dom
			 */
			setFormError(form, submission);
		},
		async onSubmit(event, { submission }) {
			if (submission.type === 'validate' && submission.metadata !== 'email') {
				event.preventDefault();
			}
		},
	});
	const { name, email, title } = useFieldset(form.ref, form.config);

	return (
		<Form method="post" {...form.props}>
			<fieldset>
				<label>
					<div>Name</div>
					<input
						className={name.error ? 'error' : ''}
						{...conform.input(name.config)}
					/>
					<div>{name.error}</div>
				</label>
				<label>
					<div>Email</div>
					<input
						className={email.error ? 'error' : ''}
						{...conform.input(email.config)}
					/>
					<div>{email.error}</div>
				</label>
				<label>
					<div>Title</div>
					<input
						className={title.error ? 'error' : ''}
						{...conform.input(title.config)}
					/>
					<div>{title.error}</div>
				</label>
			</fieldset>
			<button type="submit">Save</button>
		</Form>
	);
}
