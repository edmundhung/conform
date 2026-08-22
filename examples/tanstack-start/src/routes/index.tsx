import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
	validateSearch: (search: Record<string, unknown>) => {
		const value = search.value;

		return {
			value:
				typeof value === 'string' || value === null ? String(value) : undefined,
		};
	},
	component: Home,
});

function parseJson(value: string | undefined): unknown {
	if (value === undefined) {
		return undefined;
	}

	try {
		return JSON.parse(value);
	} catch {
		return undefined;
	}
}

function Home() {
	const { value } = Route.useSearch();
	const submittedValue = parseJson(value);

	if (submittedValue === undefined) {
		return null;
	}

	return (
		<div>
			Submitted the following value:
			<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
		</div>
	);
}
