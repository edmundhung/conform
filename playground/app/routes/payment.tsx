import { conform, parse, useFieldset, useForm } from '@conform-to/react';
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
	account: z.string(),
	amount: z.object({
		currency: z.string(),
		value: z.preprocess(ifNonEmptyString(Number), z.number()),
	}),
	timestamp: z.preprocess(
		ifNonEmptyString((value) => new Date(value)),
		z.date(),
	),
	verified: z.preprocess(
		ifNonEmptyString((value) => value === 'Yes'),
		z.boolean(),
	),
});

export let loader = async ({ request }: LoaderArgs) => {
	return parseConfig(request);
};

export let action = async ({ request }: ActionArgs) => {
	const formData = await request.formData();
	const state = parse(formData);
	const result = schema.safeParse(state.value);

	if (!result.success) {
		return {
			...state,
			error: state.error.concat(getError(result.error)),
		};
	}

	return state;
};

export default function PaymentForm() {
	const config = useLoaderData();
	const state = useActionData();
	const form = useForm<z.infer<typeof schema>>({
		...config,
		state,
	});
	const { account, amount, timestamp, verified } = useFieldset(form.props.ref, {
		...form.config,
		constraint: getFieldsetConstraint(schema),
	});
	const { currency, value } = useFieldset(form.props.ref, {
		...amount.config,
		constraint: getFieldsetConstraint(schema.shape.amount),
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Payment Form" formState={state}>
				<fieldset>
					<Field label="Account" error={account.error}>
						<input {...conform.input(account.config, { type: 'text' })} />
					</Field>
					<Field label="Currency" error={currency.error}>
						<select {...conform.select(currency.config)}>
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
							<option value="HKD">HKD</option>
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
