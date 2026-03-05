import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

import { authOptions } from "@/lib/auth";
import { redirect, Link } from "@/i18n/routing";
import { getConversationDetailAction } from "@/features/messaging/actions/conversation-queries";
import { ChatPageLayout } from "@/features/messaging/components/ChatPageLayout";

export const metadata: Metadata = {
  title: "Conversation | Tawa Services",
};

// ────────────────────────────────────────────────
// PAGE PROPS
// ────────────────────────────────────────────────

interface Props {
  params: Promise<{ conversationId: string; locale: string }>;
}

// ────────────────────────────────────────────────
// SERVER PAGE COMPONENT
// ────────────────────────────────────────────────

export default async function ClientChatPage({ params }: Props) {
  const { conversationId } = await params;
  const session = await getServerSession(authOptions);
  const locale = await getLocale();

  if (!session?.user?.id) {
    return redirect({ href: "/auth/login", locale });
  }

  if (session.user.role !== "CLIENT") {
    return redirect({ href: "/", locale });
  }

  // Fetch conversation metadata (also verifies participant)
  const detailResult = await getConversationDetailAction(conversationId);

  if (!detailResult.success) {
    // Not found or unauthorized — redirect to conversations list
    return redirect({ href: "/messages", locale });
  }

  const conversation = detailResult.data;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header bar: back arrow + other user name + booking service title */}
      <div className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-3">
        <Link
          href="/messages"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Retour aux messages"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">
            {conversation.booking.serviceTitle}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.otherUser.name}
          </p>
        </div>
      </div>

      {/* Client wrapper: ChatView (flex-1 overflow-y-auto) + MessageInput (sticky bottom) */}
      <ChatPageLayout
        conversationId={conversationId}
        currentUserId={session.user.id}
        otherUserName={conversation.otherUser.name}
      />
    </div>
  );
}
