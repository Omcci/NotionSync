import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type ModalCommitsProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedDate: string;
  commitDetails: { commit: string; author: string; date: string, status: string }[];
};

const ModalCommits = ({ open, setOpen, selectedDate, commitDetails }: ModalCommitsProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="hidden">Open</button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[75vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Commits on {selectedDate}</DialogTitle>
        </DialogHeader>
        {commitDetails.length === 0 ? (
          <p className="text-gray-500">No commits found for this date.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {commitDetails.map((commit, idx) => (
              <li key={idx} className="p-4">
                <div className="flex items-start space-x-4">
                  <div>
                    <p className="text-lg font-semibold">{commit.commit}</p>
                    <p className="text-gray-500">Author: {commit.author}</p>
                    <p className="text-gray-500">Date: {new Date(commit.date).toLocaleString()}</p>
                    <p className="text-gray-500">Status: {commit.status}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalCommits;
