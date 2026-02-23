import { z } from "zod";

// KYC document types (4-step wizard per CONTEXT.md)
export const KYC_DOC_TYPES = [
  "CIN_RECTO",
  "CIN_VERSO",
  "SELFIE",
  "PROOF_OF_ADDRESS",
] as const;

export type KycDocType = (typeof KYC_DOC_TYPES)[number];

// File validation constants
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Schema for upload endpoint — validates docType field
export const kycUploadSchema = z.object({
  docType: z.enum(KYC_DOC_TYPES, {
    errorMap: () => ({ message: "Type de document invalide" }),
  }),
});

// Schema for a single submitted document
export const kycDocumentSchema = z.object({
  docType: z.enum(KYC_DOC_TYPES, {
    errorMap: () => ({ message: "Type de document invalide" }),
  }),
  fileUrl: z.string().min(1, "L'URL du fichier est requise"),
});

// Schema for full KYC submission — all 4 document types must be present
export const kycSubmissionSchema = z
  .array(kycDocumentSchema)
  .length(4, "Vous devez soumettre exactement 4 documents")
  .refine(
    (docs) => {
      const docTypes = docs.map((d) => d.docType);
      return KYC_DOC_TYPES.every((type) => docTypes.includes(type));
    },
    {
      message:
        "Tous les types de documents sont requis: CIN Recto, CIN Verso, Selfie, Justificatif de domicile",
    },
  );

// TypeScript types derived from schemas
export type KycUploadData = z.infer<typeof kycUploadSchema>;
export type KycSubmissionData = z.infer<typeof kycSubmissionSchema>;
