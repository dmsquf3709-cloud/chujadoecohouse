import { getFooterInfo } from "@/lib/sheets";

export default async function Footer() {
  const footerInfo = await getFooterInfo();

  return (
    <footer className="bg-[#3f3f3f] text-white/70 font-sans">
      <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-10 md:py-12 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        <div>
          <p className="whitespace-pre-wrap text-xs md:text-sm leading-[2]">
            {footerInfo}
          </p>

          
        </div>

        <div className="text-2xl md:text-4xl font-black tracking-tight text-white">
          T. 010-2715-5979
        </div>
      </div>
    </footer>
  );
}