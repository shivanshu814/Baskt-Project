/** @format */

import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from '../router';

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// tRPC middleware
app.use(
	'/trpc',
	trpcExpress.createExpressMiddleware({
		router: appRouter,
		createContext: () => ({}),
	})
);

// Health check endpoint
app.get('/health', (_req, res) => {
	res.json({ status: 'ok' });
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
	console.log(`tRPC endpoint: http://localhost:${port}/trpc`);
});
