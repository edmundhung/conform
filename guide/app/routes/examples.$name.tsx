import { LoaderFunctionArgs, redirect } from '@remix-run/cloudflare';
import { getMetadata } from '~/util';

export async function loader({ params, context }: LoaderFunctionArgs) {
	const { owner, repo, ref } = getMetadata(context);

	return redirect(
		`https://github.com/${owner}/${repo}/tree/${ref}/examples/${params.name}`,
	);
}
