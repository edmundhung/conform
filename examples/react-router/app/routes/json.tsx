import {
	isDirty,
	parseSubmission,
	report,
	useForm,
	useFormData,
} from '@conform-to/react/future';
import { configureCoercion } from '@conform-to/zod/v4/future';
import { z } from 'zod/v4';
import { createInMemoryStore } from '~/store';
import type { Route } from './+types/json';
import { Form } from 'react-router';

const mediaSchema = z.object({
	type: z.literal('media'),
	path: z.string(),
});

const userSchema = z.object({
	firstName: z.string(),
	media: mediaSchema,
});

// not ideal, performance issues ?
const isMediaValue = (value: unknown): value is z.infer<typeof mediaSchema> =>
	mediaSchema.safeParse(value).success;

const { coerceFormValue } = configureCoercion({
	customize(type) {
		if (type === mediaSchema) {
			return (value) => {
				if (typeof value !== 'string') {
					return value;
				}
				try {
					return JSON.parse(value);
				} catch (err) {
					// Keep raw input so schema validation can surface a normal field error
					return value;
				}
			};
		}
		return null;
	},
});

const schema = coerceFormValue(userSchema);

const store = createInMemoryStore<z.infer<typeof schema>>();

export async function loader() {
	const user = await store.getValue();
	return {
		user,
	};
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData);
	const result = schema.safeParse(submission.payload);

	if (!result.success) {
		return {
			result: report(submission, {
				error: {
					issues: result.error.issues,
				},
			}),
		};
	}

	await store.setValue(result.data);

	return {
		result: report(submission, {
			reset: true,
			value: result.data,
		}),
	};
}

export default function Component({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { form, fields } = useForm(schema, {
		lastResult: actionData?.result,
		defaultValue: loaderData.user,
	});

	const dirty = useFormData(
		form.id,
		(formData) =>
			isDirty(formData, {
				defaultValue: form.defaultValue,
				serialize: (value, defaultSerialize) => {
					if (isMediaValue(value)) {
						return JSON.stringify(value);
					}
					return defaultSerialize(value);
				},
			}) ?? false,
	);

	return (
		<div>
			<Form {...form.props} method="post">
				<div>
					<label htmlFor={fields.firstName.id}>Title</label>
					<input
						id={fields.firstName.id}
						type="text"
						defaultValue={fields.firstName.defaultValue}
						name={fields.firstName.name}
					/>
					<div>{fields.firstName.errors}</div>
				</div>
				<div>
					<label htmlFor={fields.media.id}>Media</label>
					<input
						id={fields.media.id}
						type="text"
						defaultValue={fields.media.defaultJSON}
						name={fields.media.nameForJSON}
					/>
					<div>{fields.media.errors}</div>
				</div>
				<button type="submit" disabled={!dirty}>
					Save
				</button>
			</Form>
		</div>
	);
}
