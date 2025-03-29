/** @format */

'use client';

import { TestButton } from '../components/TestButton';

export default function Home() {
	return (
		<main className='min-h-screen p-8'>
			<h1 className='text-3xl font-bold mb-8'>Main App</h1>
			<TestButton />
		</main>
	);
}
