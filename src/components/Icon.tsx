// Line icons in the same style as the nav (2px stroke, round joins), so the
// casino, wiki and sign-up don't fall back to emoji.

export type IconName = "coin" | "timer" | "dice" | "slots" | "book" | "scroll" | "help" | "heart" | "repost" | "comment" | "parachute" | "spark" | "penguin";

const PATHS: Record<IconName, React.ReactNode> = {
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 9.5v5" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 13.5V10M9.5 2.5h5M12 2.5V6M18.5 6.5l1.5-1.5" />
    </>
  ),
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  slots: (
    <>
      <rect x="2.5" y="5" width="16" height="14" rx="3" />
      <path d="M7.8 9v6M13.2 9v6M18.5 9h1.5a1 1 0 0 1 1 1v3M21 6.5v0" />
      <circle cx="21" cy="5.5" r="1.3" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7.5h8" />
    </>
  ),
  scroll: (
    <>
      <path d="M8 3h11a2 2 0 0 1 2 2v1H10M8 3a2 2 0 0 0-2 2v14a2 2 0 0 1-2 2h11a2 2 0 0 0 2-2V6" />
      <path d="M10 9.5h4M10 13h4M10 16.5h2" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.4" />
      <circle cx="12" cy="17" r=".6" fill="currentColor" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" />,
  repost: <path d="M4 10V8a3 3 0 0 1 3-3h11l-3-3M20 14v2a3 3 0 0 1-3 3H6l3 3" />,
  comment: <path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.4-4.6A7.5 7.5 0 1 1 20 12Z" />,
  parachute: (
    <>
      <path d="M3 11a9 9 0 0 1 18 0Z" />
      <path d="M3 11l7.5 7M21 11l-7.5 7M12 11v7" />
      <rect x="10" y="18" width="4" height="3.5" rx="1" />
    </>
  ),
  spark: <path d="M12 3c.6 4.7 2.3 6.4 7 7-4.7.6-6.4 2.3-7 7-.6-4.7-2.3-6.4-7-7 4.7-.6 6.4-2.3 7-7Z" />,
  penguin: (
    <>
      <path d="M7 21c-.6-6 0-12 5-14.5C17 9 17.6 15 17 21Z" />
      <path d="M9.5 21c-.3-3.5.5-6 2.5-6.5 2 .5 2.8 3 2.5 6.5M10 10.5h.01M14 10.5h.01" />
      <path d="M11 12.3 12 13l1-.7" />
    </>
  ),
};

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name]}
    </svg>
  );
}
