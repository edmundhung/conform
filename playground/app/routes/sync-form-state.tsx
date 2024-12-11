import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { useState } from 'react';
import { z } from 'zod';
import { Playground, Field } from '~/components';

const schema = z.object({
	input: z.object({
		text: z.string(),
		number: z.number(),
	}),
	textarea: z.string(),
	select: z.string(),
	multiSelect: z.array(z.string()),
	checkbox: z.boolean(),
	checkboxGroup: z.array(z.string()),
	radioGroup: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	return json({
		lastResult: submission.reply({
			resetForm: true,
		}),
		defaultValue: {
			input: {
				text: 'Default text',
				number: 4,
			},
			textarea: 'You need to write something here',
			select: 'red',
			multiSelect: ['apple', 'banana', 'cherry'],
			checkbox: false,
			checkboxGroup: ['JS', 'CSS'],
			radioGroup: 'Français',
		},
	});
}

export default function Example() {
	const actionData = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult: actionData?.lastResult,
		shouldValidate: 'onBlur',
		onValidate: ({ formData }) => parseWithZod(formData, { schema }),
		defaultValue: actionData?.defaultValue ?? {
			input: {
				text: 'Hello World',
				number: 2,
			},
			textarea: 'Once upon a time',
			select: 'green',
			multiSelect: ['banana', 'cherry'],
			checkbox: false,
			checkboxGroup: ['HTML', 'CSS'],
			radioGroup: 'Deutsch',
		},
		constraint: {
			'input.text': {
				required: true,
				minLength: 5,
				maxLength: 30,
				pattern: '[a-zA-Z]+',
			},
			'input.number': {
				min: 5,
				max: 10,
				step: 1,
			},
			textarea: {
				required: true,
				minLength: 10,
				maxLength: 1000,
			},
			select: {
				required: true,
			},
			multiSelect: {
				multiple: true,
			},
			checkbox: {
				required: true,
			},
			checkboxGroup: {
				required: true,
			},
			radioGroup: {
				required: true,
			},
		},
		shouldSyncElement(element) {
			return element.name !== 'token';
		},
	});
	const inputFields = fields.input.getFieldset();
	const [showNumberField, setShowNumberField] = useState(true);

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Sync form state" result={actionData?.lastResult}>
				<Field label="Token">
					<input name="token" defaultValue="1-0624770" />
				</Field>
				<Field label="Text" meta={inputFields.text}>
					<input name={inputFields.text.name} />
				</Field>
				{showNumberField ? (
					<Field label="Number" meta={inputFields.number}>
						<input type="number" name={inputFields.number.name} />
					</Field>
				) : null}
				<Field label="Textarea" meta={fields.textarea}>
					<textarea name={fields.textarea.name} />
				</Field>
				<Field label="Select" meta={fields.select}>
					<select name={fields.select.name}>
						<option value="red">Red</option>
						<option value="green">Green</option>
						<option value="blue">Blue</option>
					</select>
				</Field>
				<Field label="Multi select" meta={fields.multiSelect}>
					<select name={fields.multiSelect.name}>
						<option value="apple">Apple</option>
						<option value="banana">Banana</option>
						<option value="cherry">Cherry</option>
					</select>
				</Field>
				<Field label="Checkbox" meta={fields.checkbox}>
					<label className="inline-block">
						<input type="checkbox" name={fields.checkbox.name} />
						<span className="p-2">Show number field</span>
					</label>
				</Field>
				<Field label="Checkbox group" meta={fields.checkboxGroup}>
					{['HTML', 'CSS', 'JS'].map((value) => (
						<label key={value} className="inline-block">
							<input
								type="checkbox"
								name={fields.checkboxGroup.name}
								value={value}
							/>
							<span className="p-2">{value}</span>
						</label>
					))}
				</Field>
				<Field label="Radio" meta={fields.radioGroup}>
					{['English', 'Deutsch', 'Français'].map((value) => (
						<label key={value} className="inline-block">
							<input type="radio" name={fields.radioGroup.name} value={value} />
							<span className="p-2">{value}</span>
						</label>
					))}
				</Field>
				<button
					{...form.update.getButtonProps({
						value: {
							input: {
								text: 'Updated',
								number: 3,
							},
							textarea: 'Some text here',
							select: 'blue',
							multiSelect: ['apple', 'cherry'],
							checkbox: true,
							checkboxGroup: ['HTML', 'JS'],
							radioGroup: 'English',
						},
					})}
				>
					Update value
				</button>
				<hr />
				<button
					type="button"
					onClick={() => setShowNumberField((prev) => !prev)}
				>
					Toggle number field
				</button>
			</Playground>
		</Form>
	);
}
