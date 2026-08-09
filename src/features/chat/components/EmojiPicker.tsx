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

  return (
    <div
      className={cn(
        "w-72 rounded-2xl border border-default-200 bg-content1 p-2 shadow-lg",
        className
      )}
    >
      {EMOJI_GROUPS.map((group) => (
        <div key={group.labelKey} className="mb-1 last:mb-0">
          <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-default-400">
            {t(`composer.emojiGroups.${group.labelKey}`)}
          </p>
          <div className="grid grid-cols-8 gap-0.5">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-default-100"
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
      ))}
    </div>
  );
}
