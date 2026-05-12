// 1. 타입 정의
export type RoomInfo = {
  id: string;
  category: string;
  building: string;
  name: string;
  photos: string[];
  weekdayPrice: number;
  weekendPrice: number;
  capacity: string;
  description: string;
};

export type PolicyOption = {
  category: string;
  item: string;
  price: number;
  note: string;
  info: string;
};

export type ReservationField = {
  label: string;
  type: string;
  note: string;
};

export type DirectionInfo = {
  title: string;
  address: string;
  publicTransport: string;
};

// 2. 환경 변수 체크 함수
function getEnv(name: string): string {
  const v =
    process.env[name] ||
    process.env[`NEXT_PUBLIC_${name}`] ||
    process.env[name.replace("NEXT_PUBLIC_", "")];

  return v || "";
}

// 3. 숫자 변환 유틸
function toNum(v: any): number {
  if (!v) return 0;
  return Number(String(v).replace(/[^0-9.-]/g, "")) || 0;
}

// 4. 공통 시트 호출 함수
async function fetchSheetData(range: string) {
  const apiKey = getEnv("NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY");
  const sheetId = getEnv("NEXT_PUBLIC_GOOGLE_SHEETS_ID");

  if (!apiKey || !sheetId) {
    console.warn("환경 변수(API KEY 또는 ID) 설정이 누락되었습니다.");
    return [];
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) {
      console.error(`시트 호출 실패 (${range}):`, res.statusText);
      return [];
    }

    const data = await res.json();
    return data.values || [];
  } catch (e) {
    console.error("데이터 로드 중 네트워크 에러:", e);
    return [];
  }
}

/** 탭 1: information */
export async function getInformations(): Promise<RoomInfo[]> {
  const rows = await fetchSheetData("informations!A2:O");

  return rows.map((row) => ({
    id: row[0] || "",
    category: row[1] || "", // B열
    building: row[2] || "", // C열
    name: row[3] || "", // D열
    photos: row[6]
      ? row[6]
          .split(",")
          .map((img: string) => img.trim())
          .filter((img: string) => img.startsWith("http"))
      : [],
    weekdayPrice: toNum(row[7]),
    weekendPrice: toNum(row[8]),
    capacity: row[12] || "",
    description: row[13] || "",
  }));
}

/** 오시는 길 정보 */
export async function getDirectionInfo(): Promise<DirectionInfo | null> {
  const rows = await fetchSheetData("informations!A2:O");

  const row = rows.find((r) => r[1]?.toString().trim() === "오시는 길");

  if (!row) return null;

  return {
    title: row[1] || "오시는 길",
    address: row[13] || "",
    publicTransport: row[14] || "",
  };
}

/** 탭 2: Policy_Options */
export async function getPolicyOptions(): Promise<PolicyOption[]> {
  const rows = await fetchSheetData("Policy_Options!A2:E");

  return rows.map((row) => ({
    category: row[0] || "",
    item: row[1] || "",
    price: toNum(row[2]),
    note: row[3] || "",
    info: row[4] || "",
  }));
}

/** 탭 3: reservation */
export async function getReservationFields(): Promise<ReservationField[]> {
  const rows = await fetchSheetData("reservation!A2:C");

  return rows.map((row) => ({
    label: row[0] || "",
    type: row[1] || "",
    note: row[2] || "",
  }));
}
/** 푸터 사업자 정보 */
export async function getFooterInfo(): Promise<string> {
  const rows = await fetchSheetData("informations!O2:O2");
  return rows?.[0]?.[0] || "";
}
/** 상단 배경 슬라이드 사진 */
export async function getHeroSlides(): Promise<string[]> {
  const rows = await fetchSheetData("informations!P2:P2");
  const value = rows?.[0]?.[0] || "";

  return value
    .split(",")
    .map((url: string) => url.trim())
    .filter((url: string) => url.startsWith("http"));
}
export const getRoomsFromSheet = getInformations;