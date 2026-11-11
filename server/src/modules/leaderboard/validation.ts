import { z } from 'zod'

export const leaderboardPreferenceSchema = z.object({ optedIn: z.boolean() }).strict()
