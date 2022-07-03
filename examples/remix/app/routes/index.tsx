import { Link } from '@remix-run/react';

export default function LoginForm() {
	return (
		<>
			<header className="p-8">
				<h1 className="text-xl">conform</h1>
			</header>
			<ul className="bg-white border drop-shadow rounded-lg divide-y">
				<li>
					<Link className="block p-8" to="search">
						<div>Basic example</div>
						<div className="text-gray-500">
							Building a simple search form with React
						</div>
					</Link>
				</li>
				<li>
					<Link className="block p-8" to="signup">
						<div>Zod example</div>
						<div className="text-gray-500">
							Validating a signup form end to end using Zod
						</div>
					</Link>
				</li>
				<li>
					<Link className="block p-8" to="order">
						<div>Nested list example</div>
						<div className="text-gray-500">
							Composing nested list using `useFieldset` and `useFieldList`
						</div>
					</Link>
				</li>
			</ul>
		</>
	);
}
