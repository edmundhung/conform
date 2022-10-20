import {
	conform,
	parse,
	reportValidity,
	useFieldset,
	useForm,
} from '@conform-to/react';
import {
	getError,
	getFieldsetConstraint,
	ifNonEmptyString,
} from '@conform-to/zod';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

const schema = z.object({
	iban: z
		.string()
		.min(1, 'IBAN is required')
		.regex(
			/^[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4}(?:[ ]?[0-9]{1,2})?$/,
			'Please provide a valid IBAN',
		),
	amount: z.object({
		currency: z.string().min(3, 'Please select a currency'),
		value: z.preprocess(
			ifNonEmptyString(Number),
			z.number({ required_error: 'Value is required' }).min(1),
		),
	}),
	timestamp: z.preprocess(
		ifNonEmptyString((value) => new Date(value)),
		z.date({ required_error: 'Timestamp is required' }),
	),
	verified: z.preprocess(
		ifNonEmptyString((value) => value === 'Yes'),
		z.boolean().optional().refine(Boolean, 'Please verify'),
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
			error: getError(result.error),
		};
	}

	return submission;
};

export default function PaymentForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<z.infer<typeof schema>>({
		...config,
		state,
		onValidate: config.validate
			? ({ form, submission }) => {
					const result = schema.safeParse(submission.value);

					if (!result.success) {
						submission.error = submission.error.concat(getError(result.error));
					}

					return reportValidity(form, submission);
			  }
			: undefined,
		onSubmit:
			config.mode === 'server-validation'
				? (event, { submission }) => {
						if (submission.type === 'validate') {
							event.preventDefault();
						}
				  }
				: undefined,
	});
	const { iban, amount, timestamp, verified } = useFieldset(form.ref, {
		...form.config,
		constraint: getFieldsetConstraint(schema),
	});
	const { currency, value } = useFieldset(form.ref, {
		...amount.config,
		constraint: getFieldsetConstraint(schema.shape.amount),
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Payment Form" state={state}>
				<fieldset>
					<Field label="IBAN" error={iban.error}>
						<input {...conform.input(iban.config, { type: 'text' })} />
					</Field>
					<Field label="Currency" error={currency.error}>
						<select {...conform.select(currency.config)}>
							<option value="">Please specify</option>
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
							<option value="GBP">GBP</option>
						</select>
					</Field>
					<Field label="Value" error={value.error}>
						<input {...conform.input(value.config, { type: 'number' })} />
					</Field>
					<Field label="Timestamp" error={timestamp.error}>
						<input {...conform.input(timestamp.config, { type: 'text' })} />
					</Field>
					<Field label="Verified" error={verified.error} inline>
						<input
							{...conform.input(verified.config, {
								type: 'checkbox',
								value: 'Yes',
							})}
						/>
					</Field>
				</fieldset>
			</Playground>
		</Form>
	);
}
