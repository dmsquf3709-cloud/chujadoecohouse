import { getInformations, getPolicyOptions } from "@/lib/sheets";
import RoomDetailClient from "./RoomDetailClient";

type Props = {
  params: {
    roomId: string;
  };
  searchParams: {
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  };
};

export default async function RoomDetailPage({ params, searchParams }: Props) {
  const rooms = await getInformations();
  const policies = await getPolicyOptions();

  const decodedRoomId = decodeURIComponent(params.roomId);

  const room = rooms.find((item) => {
    return item.category === "객실 예약" && item.id === decodedRoomId;
  });

  if (!room) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans">
        객실 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <RoomDetailClient
      room={room}
      policies={policies}
      initialCheckIn={searchParams.checkIn || ""}
      initialCheckOut={searchParams.checkOut || ""}
      initialGuests={Number(searchParams.guests || 2)}
    />
  );
}