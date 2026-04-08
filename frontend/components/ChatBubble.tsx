import clsx from "clsx";

interface Props {
  role: "user" | "assistant";
  content: string;
  personaName?: string;
  avatarColor?: string;
}

export default function ChatBubble({ role, content, personaName, avatarColor }: Props) {
  const isUser = role === "user";

  return (
    <div className={clsx("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      {!isUser && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
          style={{ backgroundColor: avatarColor ?? "#6366f1" }}
        >
          {(personaName ?? "?").charAt(0).toUpperCase()}
        </div>
      )}
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
          Y
        </div>
      )}

      {/* Bubble */}
      <div className={clsx("max-w-[75%]", isUser ? "items-end" : "items-start", "flex flex-col gap-1")}>
        <span className="text-xs text-gray-500 px-1">
          {isUser ? "You" : personaName}
        </span>
        <div
          className={clsx(
            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
            isUser
              ? "bg-indigo-500 text-white rounded-tr-sm"
              : "bg-[#22223a] text-gray-200 rounded-tl-sm"
          )}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
