import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { coerceZodFormData, flattenZodErrors } from '~/conform-zod';
import { Form, useActionData } from '@remix-run/react';
import { useRef } from 'react';
import { resolve, report, getInput, controls, configure } from '~/conform-dom';
import { getFormData, useFormState } from '~/conform-react';
import { flushSync } from 'react-dom';

const schema = coerceZodFormData(
	z.object({
		title: z.string().min(3).max(20),
		content: z.string().nonempty(),
		tasks: z
			.array(
				z.object({
					title: z.string().nonempty(),
					done: z.boolean(),
				}),
			)
			.min(1)
			.max(3),
	}),
);

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = resolve(formData, controls);
	const result = schema.safeParse(submission.value);

	if (!result.success) {
        const error = flattenZodErrors(result, submission.fields);
		const formResult = report(submission, {
			formErrors: error.formErrors,
            fieldErrors: error.fieldErrors,
		});

        return formResult;
	}

	return report(submission, {
		formErrors: ['Something went wrong'],
	});
}

export default function Example() {
	const result = useActionData<typeof action>();
	const formRef = useRef<HTMLFormElement>(null);
    const [state, update] = useFormState({
        result,
        controls,
        formRef,
		configure,
    })

	return (
		<Form
			id="example"
			method="post"
			ref={formRef}
			onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
				const formData = getFormData(event);
				const submission = resolve(formData, control);
				const result = schema.safeParse(submission.value);

				if (!result.success || submission.intent) {
					event.preventDefault();
				}

				const error = flattenZodErrors(result, submission.fields);
				const formResult = report(submission, {
					formErrors: error.formErrors,
					fieldErrors: error.fieldErrors,
				});

				flushSync(() => {
					update(formResult);
				});
			}}
			onInput={(event: React.FormEvent<HTMLElement>) => {
                const input = getInput(event.target, formRef.current);

                if (input && state.touched.includes(input.name)) {
                    controls.submit(formRef.current, {
                        type: 'validate',
                        payload: {
                            name: input.name
                        },
                    });
                }
			}}
			onBlur={(event: React.FocusEvent<HTMLElement>) => {
				const input = getInput(event.target, formRef.current);

                if (input && !state.touched.includes(input.name)) {
                    controls.submit(formRef.current, {
                        type: 'validate',
                        payload: {
                            name: input.name
                        },
                    });
                }
			}}
		>
			<div>{state.errors.formErrors}</div>
			<div>
				Username
				<input
					name="username"
					defaultValue={state.defaultValue.username}
				/>
				<div>{state.errors.fieldErrors.username}</div>
			</div>
            <div>
				Password
				<input
					name="password"
					defaultValue={state.defaultValue.password}
				/>
				<div>{state.errors.fieldErrors.password}</div>
			</div>
			<div>
				<button>Submit</button>
			</div>
			<div>
				<button
					name={form.control}
					value={form.serialize({
						type: 'reset',
					})}
				>
					Reset form
				</button>
			</div>
		</Form>
	);
}