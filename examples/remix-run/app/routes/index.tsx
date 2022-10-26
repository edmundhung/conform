import { Link } from '@remix-run/react';

export default function Index() {
	return (
		<ul>
			<li>
				<Link to="basic">Basic setup</Link>
			</li>
			<li>
				<Link to="zod">Server validation with Zod</Link>
			</li>
			<li>
				<Link to="async-validation">Client validation with fallback</Link>
			</li>
		</ul>
	);
}
