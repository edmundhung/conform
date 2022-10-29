import { Link } from '@remix-run/react';

export default function Index() {
	return (
		<ul>
			<li>
				<Link to="server-validation">Server validation</Link>
			</li>
			<li>
				<Link to="zod">Server validation with Zod</Link>
			</li>
			<li>
				<Link to="async-validation">Client validation with passthrough</Link>
			</li>
			<li>
				<Link to="todos">Todos list</Link>
			</li>
		</ul>
	);
}
