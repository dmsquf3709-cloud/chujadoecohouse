"use client";

import { useEffect, useState } from "react";

type Props = {
  images: string[];
  children: React.ReactNode;
  heightClass?: string;
};

function convertDriveUrl(url: string) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  const match =
    trimmedUrl.match(/\/d\/(.+?)\//) ||
    trimmedUrl.match(/id=(.+?)(?:&|$)/);

  if (match?.[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=s2000`;
  }

  return trimmedUrl;
}

export default function HeroSlider({
  images,
  children,
  heightClass = "h-[78vh] min-h-[620px]",
}: Props) {
  const [index, setIndex] = useState(0);

  const slideImages = images.map(convertDriveUrl).filter(Boolean);

  useEffect(() => {
    if (slideImages.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slideImages.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [slideImages.length]);

  return (
    <section className={`relative ${heightClass} overflow-hidden`}>
      {slideImages.map((image, i) => (
        <img
          key={`${image}-${i}`}
          src={image}
          alt="추자도 에코하우스"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 h-full">{children}</div>

      {slideImages.length > 1 && (
        <div className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 flex items-center gap-3">
          {slideImages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-10 bg-white" : "w-2 bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}