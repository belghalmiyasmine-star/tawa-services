"use client";

// ============================================================
// CHAT PAGE LAYOUT
// ============================================================
//
// Client-side wrapper that composes ChatView + MessageInput.
// Wires the onMessageSent callback: when a message is sent,
// ChatView.addOptimisticMessage() is called for instant visual feedback.
// The 15s polling confirms the message on the next tick.
// ============================================================

import { useCallback, useRef } from "react";

import { ChatView, type ChatViewHandle } from "./ChatView";
import { MessageInput } from "./MessageInput";

interface ChatPageLayoutProps {
  conversationId: string;
  currentUserId: string;
  otherUserName: string;
}

export function ChatPageLayout({
  conversationId,
  currentUserId,
  otherUserName,
}: ChatPageLayoutProps) {
  const chatViewRef = useRef<ChatViewHandle>(null);

  const handleMessageSent = useCallback((content: string, imageUrl?: string) => {
    chatViewRef.current?.addOptimisticMessage(content, imageUrl);
  }, []);

  return (
    <>
      {/* Chat message list — takes all remaining height */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatView
          ref={chatViewRef}
          conversationId={conversationId}
          currentUserId={currentUserId}
          otherUserName={otherUserName}
        />
      </div>

      {/* Message input — fixed at bottom */}
      <MessageInput
        conversationId={conversationId}
        onMessageSent={handleMessageSent}
      />
    </>
  );
}
