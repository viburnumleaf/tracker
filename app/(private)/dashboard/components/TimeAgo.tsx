"use client";

import { useEffect, useState } from "react";

interface TimeAgoProps {
  date: Date | string;
  className?: string;
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const past = typeof date === "string" ? new Date(date) : date;
      const diffMs = now.getTime() - past.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      let result = "";
      if (diffSecs < 60) {
        result = "just now";
      } else if (diffMins < 60) {
        result = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        result = `${diffHours}h ago`;
      } else if (diffDays < 7) {
        result = `${diffDays}d ago`;
      } else if (diffWeeks < 4) {
        result = `${diffWeeks}w ago`;
      } else if (diffMonths < 12) {
        result = `${diffMonths}mo ago`;
      } else {
        result = `${diffYears}y ago`;
      }

      setTimeAgo(result);
    };

    updateTimeAgo();
    
    // Update every minute for better UX
    const interval = setInterval(updateTimeAgo, 60000);
    
    return () => clearInterval(interval);
  }, [date]);

  if (!timeAgo) {
    return null;
  }

  return (
    <span className={className} title={typeof date === "string" ? new Date(date).toLocaleString() : date.toLocaleString()}>
      {timeAgo}
    </span>
  );
}
