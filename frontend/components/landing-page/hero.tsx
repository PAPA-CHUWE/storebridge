import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HeroContent } from "@/features/storefront/types";
import { HeroArt } from "./hero-art";

export function Hero({ eyebrow, title, body, action, image }: HeroContent) {
  return (
    <section aria-labelledby="hero-title" className="bg-mint-soft">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
        <div>
          {eyebrow ? (
            <p className="mb-3 text-sm font-semibold tracking-wide text-teal-ink uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1
            id="hero-title"
            className="max-w-[16ch] text-3xl leading-[1.08] font-bold tracking-[-0.03em] text-navy sm:text-[clamp(2.5rem,5vw,3.5rem)]"
          >
            {title}
          </h1>
          <p className="mt-4 max-w-md text-base text-muted">{body}</p>
          <Button asChild className="mt-8 h-11 px-5">
            <Link href={action.href}>
              {action.label}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(min-width: 1152px) 544px, (min-width: 768px) 50vw, 100vw"
            priority
            className="h-auto w-full rounded-panel object-cover"
          />
        ) : (
          <HeroArt />
        )}
      </div>
    </section>
  );
}
