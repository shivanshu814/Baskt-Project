/**
 * TRPC React client for communicating with the backend AppRouter.
 * Use this instance to access backend procedures throughout the app.
 */

import type { AppRouter } from '@baskt/backend';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>();
