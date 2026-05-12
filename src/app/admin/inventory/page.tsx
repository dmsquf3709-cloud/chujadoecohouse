import { getInformations } from "@/lib/sheets";
import InventoryClient from "@/app/admin/inventory/inventory-client";

export default async function AdminInventoryPage() {
  const allRooms = await getInformations();

  const rooms = allRooms.filter((room) => {
    return room.category === "객실 예약" && room.id && room.building && room.name;
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-10">
        <InventoryClient rooms={rooms} />
      </div>
    </main>
  );
}