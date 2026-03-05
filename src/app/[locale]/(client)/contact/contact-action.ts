"use server";

import { prisma } from "@/lib/prisma";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContactFormAction(data: ContactFormData) {
  const { name, email, subject, message } = data;

  // Basic validation
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return { success: false, message: "Veuillez remplir tous les champs." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Adresse email invalide." };
  }

  if (message.trim().length < 10) {
    return {
      success: false,
      message: "Le message doit contenir au moins 10 caractères.",
    };
  }

  try {
    await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    return {
      success: true,
      message:
        "Votre message a été envoyé avec succès. Nous vous répondrons sous 24h.",
    };
  } catch {
    return {
      success: false,
      message: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}
