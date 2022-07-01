import { Link } from '@remix-run/react';

export default function LoginForm() {
	return (
		<>
			<header className="p-8">
				<h1 className="text-xl">conform</h1>
				<div>Examples</div>
			</header>
			<ul className="bg-white border drop-shadow rounded-lg divide-y">
				<li>
					<Link className="block p-8" to="search">
						<div>Simple example - Search form</div>
						<div className="text-gray-500">Showcasing basic setup</div>
					</Link>
				</li>
				<li>
					<Link className="block p-8" to="signup">
						<div>Real life example - Signup form</div>
						<div className="text-gray-500">
							Covering `server-side validation`, `custom message` and
							`conditional constraint`
						</div>
					</Link>
				</li>
				<li>
					<Link className="block p-8" to="order">
						<div>Advance example - Order Form</div>
						<div className="text-gray-500">
							Demonstrating `nested structure` and `lists` by composing multiple
							fieldset
						</div>
					</Link>
				</li>
			</ul>
		</>
	);
}
