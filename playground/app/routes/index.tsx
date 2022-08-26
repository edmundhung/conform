import { Link } from '@remix-run/react';

export default function Home() {
	return (
		<ul>
			<li>
				<Link className="hover:underline" to="basic">
					Basic
				</Link>
			</li>
			<li>
				<Link className="hover:underline" to="zod">
					Zod
				</Link>
			</li>
			<li>
				<Link className="hover:underline" to="yup">
					Yup
				</Link>
			</li>
		</ul>
	);
}
