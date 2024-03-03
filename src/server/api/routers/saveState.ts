import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const saveStateRouter = createTRPCRouter({
  getSaveState: protectedProcedure
    .input(z.object({ gameHash: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.saveState.findFirst({
        where: { gameHash: input.gameHash, userId: ctx.session.user.id },
      });
    }),

  setSaveState: protectedProcedure
    .input(z.object({ saveState: z.string(), gameHash: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingSaveState = await ctx.db.saveState.findFirst({
        where: {
          userId: ctx.session.user.id,
          gameHash: input.gameHash,
        },
      });
      if (existingSaveState) {
        return await ctx.db.saveState.update({
          where: { id: existingSaveState.id },
          data: { state: input.saveState },
        });
      } else {
        return await ctx.db.saveState.create({
          data: {
            state: input.saveState,
            gameHash: input.gameHash,
            user: { connect: { id: ctx.session.user.id } },
          },
        });
      }
    }),
});
