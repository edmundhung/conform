export default async function Index({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { value } = await searchParams;

	if (!value) {
		return null;
	}

	return (
		<div>
			Submitted the following value:
			<pre>{JSON.stringify(JSON.parse(value.toString()), null, 2)}</pre>
		</div>
	);
}
