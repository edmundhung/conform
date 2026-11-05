import { redirect } from 'react-router';
import type { Route } from './+types/examples.$name';
import { getMetadata } from '~/util';

export async function loader({ params, context }: Route.LoaderArgs) {
	const { owner, repo, ref } = getMetadata(context);

	return redirect(
		`https://github.com/${owner}/${repo}/tree/${ref}/examples/${params.name}`,
	);
}
