import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const gameSaveRouter = createTRPCRouter({
  getGameSave: protectedProcedure
    .input(z.object({ gameHash: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.gameSave.findFirst({
        where: { gameHash: input.gameHash, userId: ctx.session.user.id },
      });
    }),

  setGameSave: protectedProcedure
    .input(z.object({ gameSave: z.string(), gameHash: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingGameSave = await ctx.db.gameSave.findFirst({
        where: {
          userId: ctx.session.user.id,
          gameHash: input.gameHash,
        },
      });
      if (existingGameSave) {
        return await ctx.db.gameSave.update({
          where: { id: existingGameSave.id },
          data: { saveGame: input.gameSave },
        });
      } else {
        return await ctx.db.gameSave.create({
          data: {
            saveGame: input.gameSave,
            gameHash: input.gameHash,
            user: { connect: { id: ctx.session.user.id } },
          },
        });
      }
    }),
});
