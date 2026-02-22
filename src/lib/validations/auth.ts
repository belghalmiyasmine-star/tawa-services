import { z } from "zod";
import { emailSchema, tunisianPhoneSchema, passwordSchema } from "./common";

// Schema d'inscription — wizard 3 etapes
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Le prenom doit contenir au moins 2 caracteres")
      .max(50, "Le prenom ne peut pas depasser 50 caracteres"),
    lastName: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caracteres")
      .max(50, "Le nom ne peut pas depasser 50 caracteres"),
    email: emailSchema,
    phone: tunisianPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["CLIENT", "PROVIDER"], {
      errorMap: () => ({ message: "Role invalide" }),
    }),
    acceptCGU: z.literal(true, {
      errorMap: () => ({ message: "Vous devez accepter les CGU" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// Schema de connexion
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Le mot de passe est requis"),
});

// Schema de reinitialisation mot de passe
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// Types derives des schemas
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
