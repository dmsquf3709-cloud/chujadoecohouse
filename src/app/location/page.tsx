import { getDirectionInfo, getHeroSlides } from "@/lib/sheets";
import HeroSlider from "@/components/HeroSlider";

export default async function LocationPage() {
  const data = await getDirectionInfo();
  const heroSlides = await getHeroSlides();

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans">
        오시는 길 데이터를 찾을 수 없습니다.
      </div>
    );
  }

  const address = data.address || "추자도 에코하우스";

  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    address
  )}&output=embed`;

  return (
    <main className="bg-white text-slate-900 font-sans antialiased">
      <HeroSlider images={heroSlides} heightClass="h-[58vh] min-h-[460px]">
        <div className="h-full flex items-center justify-center text-center px-8">
          <div>
            <p className="text-white/85 tracking-[0.42em] uppercase text-sm md:text-base font-bold font-mono mb-6">
              Chujado Eco House
            </p>

            <h1 className="text-white text-6xl md:text-8xl font-black leading-[1.08]">
              LOCATION
            </h1>

            <p className="mt-8 text-white/90 text-lg md:text-xl leading-[1.9] break-keep">
              바다를 따라 천천히 도착하는 곳,
              <br />
              추자도 에코하우스입니다.
            </p>
          </div>
        </div>
      </HeroSlider>

      <section className="py-24 md:py-28">
        <div className="max-w-[1180px] mx-auto px-6 md:px-10">
          <div className="mb-10 text-center">
            <p className="text-blue-700 tracking-[0.42em] uppercase text-sm md:text-base font-bold font-mono mb-4">
              Map
            </p>

            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              오시는 길
            </h2>
          </div>

          <div className="relative w-full h-[420px] md:h-[520px] overflow-hidden bg-slate-100 shadow-xl">
            <iframe
              src={mapUrl}
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="pb-28 md:pb-36">
        <div className="max-w-[1180px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-100 bg-white shadow-lg p-8 md:p-10">
              <p className="text-blue-700 tracking-[0.35em] uppercase text-sm font-bold font-mono mb-5">
                Address
              </p>

              <h3 className="text-lg md:text-xl text-slate-900 leading-[1.8] font-bold mb-6 break-keep">
                주소
              </h3>

              <p className="whitespace-pre-wrap text-[0.88rem] md:text-[0.93rem] leading-[1.95] text-slate-500 font-normal break-keep">
                {address}
              </p>
            </div>

            <div className="border border-slate-100 bg-white shadow-lg p-8 md:p-10">
              <p className="text-blue-700 tracking-[0.35em] uppercase text-sm font-bold font-mono mb-5">
                Public Transport
              </p>

              <h3 className="text-lg md:text-xl text-slate-900 leading-[1.8] font-bold mb-6 break-keep">
                대중교통으로
              </h3>

              <p className="whitespace-pre-wrap text-[0.88rem] md:text-[0.93rem] leading-[1.95] text-slate-500 font-normal break-keep">
                {data.publicTransport || "대중교통 안내가 준비 중입니다."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}