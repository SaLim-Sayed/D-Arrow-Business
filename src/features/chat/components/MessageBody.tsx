import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { tokenizeMentions, type MentionCandidate } from "../types/chat.types";

interface MessageBodyProps {
  body: string;
  candidates: MentionCandidate[];
  isMine: boolean;
}

export function MessageBody({ body, candidates, isMine }: MessageBodyProps) {
  const tokens = useMemo(
    () => tokenizeMentions(body, candidates),
    [body, candidates]
  );

  return (
    <p className="whitespace-pre-wrap break-words">
      {tokens.map((token, index) =>
        token.type === "mention" ? (
          <span
            key={index}
            className={cn(
              "rounded px-1 font-semibold",
              isMine
                ? "bg-primary-foreground/20"
                : "bg-primary/15 text-primary"
            )}
          >
            {token.value}
          </span>
        ) : (
          <span key={index}>{token.value}</span>
        )
      )}
    </p>
  );
}
