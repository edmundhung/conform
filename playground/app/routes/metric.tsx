import {
	type FieldsetConfig,
	conform,
	useFieldset,
	useForm,
	hasError,
	useFieldList,
	reportValidity,
	parse,
} from '@conform-to/react';
import type { ActionArgs } from '@remix-run/node';
import { z } from 'zod';
import { Form, useActionData } from '@remix-run/react';
import { Playground, Field, Alert } from '~/components';
import { getError } from '@conform-to/zod';
import { useRef } from 'react';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	topic: z.string().min(1, 'Topic is required').min(4, 'Topic is too short'),
	function_key: z
		.string()
		.min(1, 'Function key is required')
		.min(6, 'Function key is too short'),
	// keys: z
	//     .object({
	//         path: z.string(),
	//     })
	//     .array(),
});

type MetricDefinition = z.infer<typeof schema>;

async function isValidJsonpath(
	topic: string,
	jsonpath: string,
): Promise<boolean> {
	return new Promise((resolve) =>
		setTimeout(() => {
			console.log('Validating', { topic, jsonpath });
			resolve(Math.random() > 0.7);
		}, Math.random() * 250),
	); // 100ms - 1s
}

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const submission = parse(formData);
	const scope = new Set(submission.scope);

	// Function key should be revalidated if topic is changed
	if (scope.has('topic')) {
		scope.add('function_key');
	}

	const result = await schema
		.refine(
			(metric) => {
				if (!scope.has('function_key')) {
					return true;
				}

				return isValidJsonpath(metric.topic, metric.function_key);
			},
			{
				message: 'The function key is invalid',
				path: ['function_key'],
			},
		)
		// .superRefine(async (metric, ctx) => {
		//     const result = await Promise.allSettled(metric.keys.map(key => isValidJsonpath(metric.topic, key.path)));

		//     for (let i = 0; i < result.length; i++) {
		//         const response = result[i];

		//         if (response.status === 'fulfilled' && response.value === false) {
		//             ctx.addIssue({
		//                 code: z.ZodIssueCode.custom,
		//                 message: 'The key is invalid',
		//                 path: ['keys', i, 'path'],
		//             })
		//         }
		//     }
		// })
		.safeParseAsync(submission.value);

	if (!result.success) {
		return {
			...submission,
			error: getError(result.error, Array.from(scope)),
			scope: Array.from(scope),
		};
	}

	return submission;
};

export default function SignupForm() {
	const state = useActionData();
	const form = useForm<MetricDefinition>({
		initialReport: 'onBlur',
		state,
		onValidate({ submission, form }) {
			const result = schema.safeParse(submission.value);
			const scope = new Set(submission.scope);

			// Function key should be revalidated if topic is changed
			if (scope.has('topic')) {
				scope.add('function_key');
			}

			const error = result.success ? [] : getError(result.error);

			if (
				scope.has('function_key') &&
				!hasError(error, 'function_key') &&
				!hasError(error, 'topic')
			) {
				return true;
			}

			return reportValidity(form, {
				scope: Array.from(scope),
				value: submission.value,
				error,
			});
		},
		onSubmit(event, { submission }) {
			switch (submission.type) {
				case 'validate':
					if (
						!submission.scope.includes('topic') &&
						!submission.scope.includes('function_key')
					) {
						event.preventDefault();
					}
			}
		},
	});
	const { name, topic, function_key /*keys*/ } = useFieldset(
		form.ref,
		form.config,
	);
	// const [keysList, keysCommand] = useFieldList(form.ref, keys.config);

	return (
		<Form method="post" {...form.props}>
			<Playground title="Signup Form" formState={state}>
				<Alert message={form.error} />
				<Field label="Name" error={name.error}>
					<input
						{...conform.input(name.config, { type: 'text' })}
						autoComplete="off"
					/>
				</Field>
				<Field label="Topic" error={topic.error}>
					<input {...conform.input(topic.config, { type: 'text' })} />
				</Field>
				<Field label="Function Key" error={function_key.error}>
					<input {...conform.input(function_key.config, { type: 'text' })} />
				</Field>
				{/* <ol>
                    {keysList.map((key, index) => (
                        <li key={key.key} className="border rounded-md p-4 mb-4">
                            <KeyFieldset {...key.config} />
                            <div className="flex flex-row gap-2">
                                <button
                                    className="rounded-md border p-2 hover:border-black"
                                    {...keysCommand.remove({ index })}
                                >
                                    Delete
                                </button>
                                <button
                                    className="rounded-md border p-2 hover:border-black"
                                    {...keysCommand.reorder({ from: index, to: 0 })}
                                >
                                    Move to top
                                </button>
                                <button
                                    className="rounded-md border p-2 hover:border-black"
                                    {...keysCommand.replace({ index, defaultValue: { path: '' } })}
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
                        {...keysCommand.prepend()}
                    >
                        Insert top
                    </button>
                    <button
                        className="rounded-md border p-2 hover:border-black"
                        {...keysCommand.append()}
                    >
                        Insert bottom
                    </button>
                </div> */}
			</Playground>
		</Form>
	);
}

// export function KeyFieldset(
// 	config: FieldsetConfig<z.infer<typeof schema.shape.keys.element>>,
// ) {
// 	const ref = useRef<HTMLFieldSetElement>(null);
// 	const { path } = useFieldset(ref, config);

// 	return (
// 		<fieldset ref={ref} form={config.form}>
// 			<Field label="Path" error={path.error}>
// 				<input {...conform.input(path.config, { type: 'text' })} />
// 			</Field>
// 		</fieldset>
// 	);
// }
