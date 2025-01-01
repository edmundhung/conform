import { ActionFunctionArgs } from '@remix-run/node';

export async function action({ request }: ActionFunctionArgs) {
	const data = await request.json();

	await new Promise((resolve) => {
		const min = 200;
		const max = 5000;
		setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min);
	});

	return new Response(
		JSON.stringify({
			data,
			sucess: false,
		}),
	);
}
