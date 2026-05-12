import { getHeroSlides, getInformations } from "@/lib/sheets";
import AboutContent from "./AboutContent";

export default async function AboutPage() {
  const allData = await getInformations();
  const heroSlides = await getHeroSlides();

  const aboutData = allData.find((item) => {
    const category = item.category?.toString().trim();
    const name = item.name?.toString().trim();

    return (
      category === "외관" ||
      name === "외관" ||
      category === "소개" ||
      name === "소개"
    );
  });

  if (!aboutData) {
    return (
      <div className="text-center py-20 font-sans">
        소개 데이터를 찾을 수 없습니다.
      </div>
    );
  }

  const photoList = aboutData.photos
    .flatMap((p) => String(p).split(","))
    .map((url) => url.trim())
    .filter(Boolean);

  let description = aboutData.description || "";
  description = description
    .replace("펜션소개", "")
    .replace("Prologue", "")
    .replace("ㅡ", "")
    .trim();

  const splitKeyword = "각박한 도심 속에서";

  const [mainText, subText = ""] = description.includes(splitKeyword)
    ? description.split(splitKeyword)
    : [description, ""];

  return (
    <AboutContent
      photos={photoList}
      heroPhotos={heroSlides.length > 0 ? heroSlides : photoList}
      mainText={mainText}
      subText={subText}
      splitKeyword={splitKeyword}
    />
  );
}