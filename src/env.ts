import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const serverEnv = serverSchema.safeParse(process.env);
const clientEnv = clientSchema.safeParse(process.env);

if (!serverEnv.success) {
  console.error("Invalid server environment variables:", serverEnv.error.flatten().fieldErrors);
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Invalid server environment variables");
  }
}

export const env = {
  ...serverEnv.data,
  ...clientEnv.data,
} as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
