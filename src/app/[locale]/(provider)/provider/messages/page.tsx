import { getServerSession } from "next-auth";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { getConversationsAction } from "@/features/messaging/actions/conversation-queries";
import { ConversationList } from "@/features/messaging/components/ConversationList";

export const metadata: Metadata = {
  title: "Messages | Tawa Services",
};

export default async function ProviderMessagesPage() {
  const session = await getServerSession(authOptions);
  const locale = await getLocale();
  const tMessaging = await getTranslations("messaging");

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "PROVIDER") {
    return redirect({ href: "/", locale });
  }

  const conversationsResult = await getConversationsAction();
  const conversations = conversationsResult.success
    ? conversationsResult.data
    : [];

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Header */}
      <div className="border-b px-4 py-4">
        <h1 className="text-lg font-semibold text-foreground">
          {tMessaging("conversations")}
        </h1>
      </div>

      {/* Conversation list */}
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {tMessaging("noConversations")}
          </p>
        </div>
      ) : (
        <ConversationList
          conversations={conversations}
          currentUserId={session.user.id}
          basePath="/provider/messages"
        />
      )}
    </div>
  );
}
