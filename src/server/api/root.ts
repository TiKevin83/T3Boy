import { createTRPCRouter } from "~/server/api/trpc";
import { saveStateRouter } from "./routers/saveState";
import { gameSaveRouter } from "./routers/gameSave";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  saveState: saveStateRouter,
  gameSave: gameSaveRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
