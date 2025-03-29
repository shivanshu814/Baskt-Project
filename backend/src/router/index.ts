/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';

export const appRouter = router({
	hello: publicProcedure
		.input(z.object({ name: z.string().optional() }))
		.query(({ input }) => {
			return {
				greeting: `Hello ${input.name ?? 'World'}!`,
			};
		}),
	help: publicProcedure.query(() => {
		return {
			endpoints: [
				{
					name: 'hello',
					type: 'query',
					description: 'Returns a greeting message',
					usage: {
						curl: 'curl "http://localhost:4000/trpc/hello?input={"name":"Your Name"}"',
						example:
							'http://localhost:4000/trpc/hello?input={"name":"Your Name"}',
					},
					parameters: {
						name: "string (optional) - The name to greet. If not provided, defaults to 'World'",
					},
				},
				{
					name: 'help',
					type: 'query',
					description:
						'Shows this help message with available endpoints and usage instructions',
				},
			],
		};
	}),
	getUsers: publicProcedure.query(() => {
		return {
			users: [
				{ id: 1, name: 'John Doe', role: 'Admin' },
				{ id: 2, name: 'Jane Smith', role: 'User' },
				{ id: 3, name: 'Bob Johnson', role: 'Manager' },
			],
		};
	}),
});

export type AppRouter = typeof appRouter;
