import { useForm } from '@conform-to/react';
import { type LoaderArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { Field, Playground } from '~/components';

export async function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	return {
		formMethod: url.searchParams.get('formMethod'),
		formAction: url.searchParams.get('formAction'),
		formEncType: url.searchParams.get('formEncType'),
		submitterMethod: url.searchParams.get('submitterMethod'),
		submitterAction: url.searchParams.get('submitterAction'),
		submitterEncType: url.searchParams.get('submitterEncType'),
	};
}

export default function Example() {
	const [attributes, setAttributes] = useState({
		method: null as string | null,
		action: null as string | null,
		encType: null as string | null,
	});
	const options = useLoaderData<typeof loader>();
	const [form] = useForm({
		onSubmit(event, { method, action, encType }) {
			event.preventDefault();

			setAttributes({ method, action, encType });
		},
	});

	return (
		<form
			action={options.formAction ?? undefined}
			method={options.formMethod ?? undefined}
			encType={options.formEncType ?? undefined}
			{...form.props}
		>
			<Playground
				title="Form attributes"
				formAction={options.submitterAction ?? undefined}
				formMethod={options.submitterMethod ?? undefined}
				formEncType={options.submitterEncType ?? undefined}
			>
				<Field label="Action">
					<input
						type="text"
						name="_action"
						value={attributes.action ?? ''}
						readOnly
					/>
				</Field>
				<Field label="EncType">
					<input
						type="text"
						name="_enctype"
						value={attributes.encType ?? ''}
						readOnly
					/>
				</Field>
				<Field label="Method">
					<input
						type="text"
						name="_method"
						value={attributes.method ?? ''}
						readOnly
					/>
				</Field>
			</Playground>
		</form>
	);
}
