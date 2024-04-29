import {
	type FormatErrorArgs,
	parse,
	validate,
	defaultFormatError,
	getError,
} from '@conform-to/validitystate';
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Playground } from '~/components';

function getConstraint(url: URL) {
	if (url.searchParams.has('constraint')) {
		return JSON.parse(url.searchParams.get('constraint') as string);
	}

	return {};
}

function getSecret(url: URL) {
	return url.searchParams.get('secret');
}

function configureFormatError(secret: string | null) {
	return (args: FormatErrorArgs<{ field: any }>): string[] => {
		const error = defaultFormatError(args);

		if (
			secret !== null &&
			((args.value.field instanceof File &&
				args.value.field.name === JSON.parse(secret)) ||
				JSON.stringify(args.value.field) === secret)
		) {
			error.push('secret');
		}

		return error;
	};
}

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);

	return json({
		constraint: getConstraint(url),
		secret: getSecret(url),
	});
}

export async function action({ request }: ActionFunctionArgs) {
	const url = new URL(request.url);
	const secret = getSecret(url);
	const formData = await request.formData();
	const submission = parse(formData, {
		constraints: { field: getConstraint(url) },
		formatError: configureFormatError(secret),
	});

	return json(submission);
}

export default function Example() {
	const { constraint, secret } = useLoaderData<typeof loader>();
	const submission = useActionData<typeof action>();
	const [error, setError] = useState(submission?.error ?? {});
	const searchParams = new URLSearchParams([
		['constraint', JSON.stringify(constraint)],
	]);

	if (secret !== null) {
		searchParams.set('secret', secret);
	}

	useEffect(() => {
		if (submission?.error) {
			setError(submission.error);
		}
	}, [submission]);

	return (
		<Form
			method="post"
			encType={constraint.type === 'file' ? 'multipart/form-data' : undefined}
			action={`?${searchParams}`}
			onSubmit={(event) => {
				const form = event.currentTarget;

				// Reset all error
				setError({});

				validate(form, {
					constraints: { field: constraint },
					formatError: configureFormatError(secret),
				});

				if (!form.reportValidity()) {
					event.preventDefault();
				}
			}}
			onInvalidCapture={(event) => {
				const input = event.target as
					| HTMLInputElement
					| HTMLSelectElement
					| HTMLTextAreaElement;

				setError((error) => ({
					...error,
					[input.name]: getError(input.validationMessage),
				}));
				event.preventDefault();
			}}
			noValidate
		>
			<Playground title="Validity State" result={submission}>
				<div className="mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Field
						</label>
						{constraint.type === 'checkbox' || constraint.type === 'radio' ? (
							<input
								name="field"
								defaultChecked={
									(constraint.value ?? 'on') === submission?.payload.field
								}
								{...constraint}
							/>
						) : constraint.type === 'select' ? (
							<select
								name="field"
								defaultValue={submission?.payload.field ?? ''}
								{...constraint}
							>
								{constraint.multiple ? null : (
									<option value="">Select an option</option>
								)}
								<option value="a">Option A</option>
								<option value="b">Option B</option>
								<option value="c">Option C</option>
							</select>
						) : constraint.type === 'textarea' ? (
							<textarea
								name="field"
								defaultValue={submission?.payload.field ?? ''}
								{...constraint}
							/>
						) : (
							<input
								name="field"
								defaultValue={submission?.payload.field ?? ''}
								{...constraint}
							/>
						)}
					</div>
					<div className="my-1 space-y-0.5">
						{!error.field ? (
							<p />
						) : (
							error.field.map((message) => (
								<p className="text-pink-600 text-sm" key={message}>
									{message}
								</p>
							))
						)}
					</div>
				</div>
			</Playground>
		</Form>
	);
}
