"use client";

import { useState } from "react";
import CardDetailsDrawer from "@/components/homepage/CardDetailsDrawer";
import { NotificationsList } from "@/components/homepage/notifications-list";

export default function DashboardPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sampleCard = {
    title: "Sample Campaign",
    description: "A sample campaign for testing",
    raised: "$1,500",
    image: "/images/card-img1.png",
    extra: "Extra info",
    date: "2024-01-15",
    timeLeft: "30 days left",
    avatar: "/images/avatar-1.png",
    creator: "John Doe",
    createdFor: "Community",
    percentage: "15%",
    total: "$10,000",
    donors: 25
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <NotificationsList />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <CardDetailsDrawer 
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            card={sampleCard}
          />
        </div>
      </div>
    </div>
  );
} 