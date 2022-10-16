import type { FieldsetConfig } from '@conform-to/react';
import {
	conform,
	useFieldList,
	useFieldset,
	useForm,
	parse,
	reportValidity,
} from '@conform-to/react';
import { getError, getFieldsetConstraint } from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { useRef } from 'react';
import { z } from 'zod';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

const schema = z.object({
	title: z.string().min(1, 'Title is required'),
	tasks: z.array(
		z.object({
			content: z.string().min(1, 'Content is required'),
			completed: z.preprocess(
				(value) => value === 'yes',
				z.boolean().optional(),
			),
		}),
	),
});

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData);
	const result = schema.safeParse(submission.value);

	if (!result.success) {
		return {
			...submission,
			error: submission.error.concat(getError(result.error, submission.scope)),
		};
	}

	return submission;
};

export default function TodosForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<z.infer<typeof schema>>({
		...config,
		state,
		onValidate: config.validate
			? ({ form, submission }) => {
					const result = schema.safeParse(submission.value);

					return reportValidity(form, {
						...submission,
						error: !result.success ? getError(result.error) : submission.error,
					});
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

	return (
		<Form method="post" {...form.props}>
			<Playground title="Todos Form" state={state}>
				<TodosFieldset {...form.config} />
			</Playground>
		</Form>
	);
}
export function TaskFieldset(
	config: FieldsetConfig<z.infer<typeof schema.shape.tasks.element>>,
) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { content, completed } = useFieldset(ref, {
		...config,
		constraint: getFieldsetConstraint(schema.shape.tasks.element),
	});
	return (
		<fieldset ref={ref} form={config.form}>
			<Field label="Content" error={content.error}>
				<input {...conform.input(content.config, { type: 'text' })} />
			</Field>
			<Field label="Completed" error={completed.error} inline>
				<input {...conform.input(completed.config, { type: 'checkbox' })} />
			</Field>
		</fieldset>
	);
}

export function TodosFieldset(config: FieldsetConfig<z.infer<typeof schema>>) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { title, tasks } = useFieldset(ref, {
		...config,
		constraint: getFieldsetConstraint(schema),
	});
	const [taskList, control] = useFieldList(ref, tasks.config);

	return (
		<fieldset ref={ref} form={config.form}>
			<Field label="Title" error={title.error}>
				<input {...conform.input(title.config, { type: 'text' })} />
			</Field>
			<ol>
				{taskList.map((task, index) => (
					<li key={task.key} className="border rounded-md p-4 mb-4">
						<TaskFieldset {...task.config} />
						<div className="flex flex-row gap-2">
							<button
								className="rounded-md border p-2 hover:border-black"
								{...control.remove({ index })}
							>
								Delete
							</button>
							<button
								className="rounded-md border p-2 hover:border-black"
								{...control.reorder({ from: index, to: 0 })}
							>
								Move to top
							</button>
							<button
								className="rounded-md border p-2 hover:border-black"
								{...control.replace({ index, defaultValue: { content: '' } })}
							>
								Clear
							</button>
						</div>
					</li>
				))}
			</ol>
			<div className="flex flex-row gap-2">
				<button
					className="rounded-md border p-2 hover:border-black"
					{...control.prepend()}
				>
					Insert top
				</button>
				<button
					className="rounded-md border p-2 hover:border-black"
					{...control.append()}
				>
					Insert bottom
				</button>
			</div>
		</fieldset>
	);
}
