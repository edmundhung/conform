import { z } from 'zod';
import { coerceFormValue } from '@conform-to/zod/v4/future';
import { Dialog as RadixDialog } from 'radix-ui';
import { useForm } from './forms';

const schema = coerceFormValue(
	z.object({
		firstName: z.string().min(1),
		lastName: z.string().min(1),
	}),
);

export function TestModal() {
	const { form, fields } = useForm(schema, {});

	return (
		<RadixDialog.Root defaultOpen>
			<RadixDialog.Content aria-describedby={undefined}>
				<RadixDialog.Title>Modal form</RadixDialog.Title>
				<form {...form.props}>
					<label htmlFor={fields.firstName.id}>First name</label>
					<input id={fields.firstName.id} name={fields.firstName.name} />
					<label htmlFor={fields.lastName.id}>Last name</label>
					<input id={fields.lastName.id} name={fields.lastName.name} />
				</form>
			</RadixDialog.Content>
		</RadixDialog.Root>
	);
}
