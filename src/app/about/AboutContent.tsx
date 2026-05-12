"use client";

import { useState } from "react";
import HeroSlider from "@/components/HeroSlider";

type AboutContentProps = {
  photos: string[];
  heroPhotos: string[];
  mainText: string;
  subText: string;
  splitKeyword: string;
};

function convertDriveUrl(url: string) {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  const match =
    trimmedUrl.match(/\/d\/(.+?)\//) ||
    trimmedUrl.match(/id=(.+?)(?:&|$)/);

  if (match?.[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=s1600`;
  }

  return trimmedUrl;
}

export default function AboutContent({
  photos,
  heroPhotos,
  mainText,
  subText,
}: AboutContentProps) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const galleryImages = photos.slice(0, 4).map(convertDriveUrl);

  const labelClass =
    "text-blue-700 tracking-[0.42em] uppercase text-sm md:text-base font-bold font-mono";

  return (
    <>
      <main className="bg-white text-slate-900 font-sans antialiased">
        <HeroSlider images={heroPhotos} heightClass="h-[78vh] min-h-[620px]">
          <div className="h-full flex items-center">
            <div className="max-w-[1400px] mx-auto w-full px-8 md:px-16">
              <div className="max-w-5xl">
                <p className="text-white/85 tracking-[0.42em] uppercase text-sm md:text-base font-bold font-mono mb-6">
                  Chujado Eco House
                </p>

                <h1 className="text-white text-5xl md:text-7xl font-black leading-[1.22] break-keep">
                  바다와 시간이
                  <br />
                  천천히 머무는 곳
                </h1>
              </div>
            </div>
          </div>
        </HeroSlider>

        <section className="py-28 md:py-36">
          <div className="max-w-[1050px] mx-auto px-8 text-center">
            <p className={`${labelClass} mb-6`}>About</p>

            <h2 className="text-[2rem] sm:text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight break-keep">
  CHUJADO ECO HOUSE
</h2>

<p className="text-base sm:text-lg md:text-xl text-slate-500 leading-[2] mb-16 break-keep">
  자연과 바다가 머무는 조용한 공간,
  <br />
  추자도 에코하우스입니다.
</p>

<div className="space-y-8 md:space-y-10 text-[0.95rem] sm:text-[1.05rem] md:text-[1.12rem] leading-[2.1] md:leading-[2.2] text-slate-600 break-keep">
              <p className="whitespace-pre-wrap">{mainText.trim()}</p>

              {subText && (
                <p className="whitespace-pre-wrap">{subText.trim()}</p>
              )}
            </div>
          </div>
        </section>

        {galleryImages.length > 0 && (
          <section className="pb-28 md:pb-36">
            <div className="max-w-[1400px] mx-auto px-6 md:px-10">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className={`${labelClass} mb-4`}>Gallery</p>

                  <h3 className="text-3xl md:text-5xl font-black tracking-tighter">
                    추자도의 순간들
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {galleryImages.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => setSelectedImg(imageUrl)}
                    className="group relative overflow-hidden bg-slate-100 aspect-[1.25/1] cursor-zoom-in"
                  >
                    <img
                      src={imageUrl}
                      alt={`추자도 에코하우스 사진 ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {selectedImg && (
        <div
          className="fixed inset-0 z-[999] bg-black/92 flex items-center justify-center p-4 md:p-10"
          onClick={() => setSelectedImg(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImg(null)}
            className="absolute top-8 right-8 text-white text-4xl"
          >
            ×
          </button>

          <img
            src={selectedImg}
            alt="확대 이미지"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}