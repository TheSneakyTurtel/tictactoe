import { z } from "zod";
export const LoginDetails = z.object({
    username: z.string().min(4),
    password: z.string().min(4),
});
export const User = z.object({
    passwordHash: z.string(),
    stats: z.optional(z.object({
        wins: z.optional(z.object({
            againstComputer: z.optional(z.array(z.number().finite().positive())),
            againstUsers: z.optional(z.array(z.number().finite().positive())),
        })),
        losses: z.optional(z.object({
            againstComputer: z.optional(z.array(z.number().finite().positive())),
            againstUsers: z.optional(z.array(z.number().finite().positive())),
        })),
    })),
});
export const Users = z.record(User);
export const UserSocketCredentials = z.object({
    username: z.string().min(4),
    passwordHash: z.string(),
});
export const Match = z.object({
    startWith: z.boolean(),
    moves: z.array(z.number().gte(0).lte(9)),
});
export const MatchRecord = z.object({
    as: z.boolean(),
    against: User,
    match: Match,
});
