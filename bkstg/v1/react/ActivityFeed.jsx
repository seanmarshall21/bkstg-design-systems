import { Avatar } from "./Avatar.jsx";

/**
 * <ActivityFeed label="Recent activity" items={[{ id, name: "Grace Lee", action: "approved the poster", time: "2h ago" }]} />
 */
export function ActivityFeed({ label, items = [], className }) {
  return (
    <ul className={["ui-feed", className].filter(Boolean).join(" ")} aria-label={label}>
      {items.map((it) => (
        <li key={it.id} className="ui-feed-item">
          <Avatar name={it.name} size="sm" />
          <p className="ui-feed-text"><strong>{it.name}</strong> {it.action}</p>
          <span className="ui-feed-time">{it.time}</span>
        </li>
      ))}
    </ul>
  );
}
