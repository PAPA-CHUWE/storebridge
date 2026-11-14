import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { ProductImage } from "@/features/storefront/types";

type ProductGalleryProps = {
  images: ProductImage[];
  /** Names the placeholder when there are no images. */
  productName: string;
};

const FRAME = "overflow-hidden rounded-panel border border-line bg-canvas";

/** The product's photos: the main one large, any others beneath it. */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [main, ...others] = images;

  if (!main) {
    return (
      <div
        className={`${FRAME} flex aspect-square items-center justify-center text-faint`}
      >
        <ImageOff aria-hidden className="size-10" />
        <span className="sr-only">No image for {productName}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`${FRAME} aspect-square`}>
        {/* Saleor serves the image at the requested size already. */}
        <Image
          src={main.url}
          alt={main.alt}
          width={1024}
          height={1024}
          unoptimized
          priority
          className="size-full object-contain"
        />
      </div>
      {others.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3">
          {others.map((image) => (
            <li key={image.url} className={`${FRAME} aspect-square`}>
              <Image
                src={image.url}
                alt={image.alt}
                width={1024}
                height={1024}
                unoptimized
                className="size-full object-contain"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
