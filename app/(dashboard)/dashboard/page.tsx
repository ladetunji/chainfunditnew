"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CompleteProfile from '../complete-profile';

export default function DashboardPage() {
  const [showFirstModal, setShowFirstModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    setShowFirstModal(true);
  }, []);

  return (
    <div className="">
      Dashboard

      {/* First Modal */}
      <Dialog open={showFirstModal} onOpenChange={setShowFirstModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to your Dashboard!</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p>To get the most out of ChainFundIt, please complete your profile.</p>
            <Button className="mt-4" onClick={() => { setShowFirstModal(false); setShowProfileModal(true); }}>
              Complete Profile
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <CompleteProfile />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
