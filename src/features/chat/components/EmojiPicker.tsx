import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const EMOJI_GROUPS: { labelKey: string; emojis: string[] }[] = [
  {
    labelKey: "smileys",
    emojis: [
      "😀", "😁", "😂", "🤣", "😊", "😍", "🥰", "😘", "😎", "🤔",
      "😅", "😢", "😭", "😡", "🤯", "😴", "🤗", "🙌", "👏", "👍",
      "👎", "👌", "✌️", "🤝", "🙏", "💪", "🔥", "✨", "⭐", "💯",
    ],
  },
  {
    labelKey: "objects",
    emojis: [
      "🎉", "🥳", "❤️", "💙", "💚", "💛", "🧡", "💜", "✅", "❌",
      "⚠️", "📌", "📎", "📁", "📄", "📝", "📅", "⏰", "💡", "🚀",
      "🎯", "🏆", "💼", "📞", "📧", "🔗", "🎤", "🎧", "📷", "🖼️",
    ],
  },
];

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onPick, className }: EmojiPickerProps) {
  const { t } = useTranslation("chat");
  const [active, setActive] = useState(EMOJI_GROUPS[0].labelKey);
  const group =
    EMOJI_GROUPS.find((item) => item.labelKey === active) ?? EMOJI_GROUPS[0];

  return (
    <div
      className={cn(
        "w-72 overflow-hidden rounded-2xl border border-default-200/80 bg-content1 shadow-premium animate-in fade-in zoom-in-95 duration-150",
        className
      )}
    >
      <div className="flex gap-1 border-b border-default-100/80 bg-default-50/50 p-1.5">
        {EMOJI_GROUPS.map((item) => (
          <button
            key={item.labelKey}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setActive(item.labelKey)}
            className={cn(
              "flex-1 rounded-xl px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
              active === item.labelKey
                ? "bg-content1 text-primary shadow-sm"
                : "text-default-400 hover:text-default-600"
            )}
          >
            {t(`composer.emojiGroups.${item.labelKey}`)}
          </button>
        ))}
      </div>
      <div className="max-h-52 overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-0.5">
          {group.emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-transform hover:bg-default-100 hover:scale-110 active:scale-95"
              onMouseDown={(event) => {
                event.preventDefault();
                onPick(emoji);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
