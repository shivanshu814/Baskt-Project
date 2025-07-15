/** @format */

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../../../services/backend/src/router';

export const trpc = createTRPCReact<AppRouter>();
