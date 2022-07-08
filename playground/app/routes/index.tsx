import { Link } from '@remix-run/react';

export default function Home() {
	return (
		<ul>
			<li>
				<Link className="hover:underline" to="basic">
					Basic
				</Link>
			</li>
		</ul>
	);
}
