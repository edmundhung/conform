import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
	validateSearch: (search: Record<string, unknown>) => ({
		value: typeof search.value === 'string' ? search.value : undefined,
	}),
	component: Home,
});

function parseJson(value: string | undefined): unknown {
	if (!value) {
		return null;
	}

	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

function Home() {
	const { value } = Route.useSearch();
	const submittedValue = parseJson(value);

	if (submittedValue === null) {
		return null;
	}

	return (
		<div>
			Submitted the following value:
			<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
		</div>
	);
}
