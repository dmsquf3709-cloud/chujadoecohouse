import { getInformations } from "@/lib/sheets";
import ReservationClient from "./ReservationClient";

export default async function ReservationPage() {
  const rooms = await getInformations();

  // 실제 객실만 필터
  const roomList = rooms.filter((room) => {
    return (
      room.building &&
      room.name &&
      room.photos?.length > 0 &&
      room.category === "객실 예약"
    );
  });

  return <ReservationClient rooms={roomList} />;
}