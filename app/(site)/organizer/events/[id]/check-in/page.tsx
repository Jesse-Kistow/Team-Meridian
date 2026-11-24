import CheckInScreen from "@/components/organizer/CheckInScreen";

// DEMO DATA. Sprint 7 replaces `result` with real scans and passes the camera as `scanner`.
export default function CheckInPage() {
  return (
    <CheckInScreen
      event={{
        id: "demo",
        title: "After Hours",
        dateLabel: "Oct 23, 2026",
        locationLabel: "The Glasshouse",
        imageUrl: null,
        status: "PUBLISHED",
        isLive: true,
      }}
      sold={248}
      checkedIn={187}
      result={{
        kind: "success",
        name: "Maya Chen",
        tierName: "General admission",
        quantity: 1,
        ticketCode: "EA-10482",
        timeLabel: "7:42 PM",
        badgeUnlocked: "Night owl",
      }}
      backHref="/organizer/events/demo"
    />
  );
}
