import Link from "next/link";
import type { LinkItem } from "@/features/storefront/types";

type AnnouncementBarProps = { message: string; link?: LinkItem };

export function AnnouncementBar({ message, link }: AnnouncementBarProps) {
  return (
    <div className="bg-navy px-4 py-2 text-center text-xs text-on-navy">
      <p className="mx-auto max-w-6xl">
        {message}
        {link ? (
          <>
            {" "}
            <Link
              href={link.href}
              className="font-semibold whitespace-nowrap text-white underline underline-offset-2 hover:text-teal"
            >
              {link.label}
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
