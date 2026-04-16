"use client";

import React from "react";
import { motion } from "framer-motion";

export const SkeletonStory = () => (
  <div className="flex flex-col items-center gap-2 shrink-0 animate-pulse">
    <div className="w-[60px] h-[60px] lg:w-[72px] lg:h-[72px] rounded-[22px] bg-white/5 border border-white/10" />
    <div className="w-12 h-2 bg-white/5 rounded-full" />
  </div>
);

export const SkeletonPost = () => (
  <div className="p-4 md:p-8 bg-[#050B14]/50 border-b border-white/[0.04] animate-pulse">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-white/5" />
      <div className="space-y-2">
        <div className="w-32 h-3 h-3 bg-white/10 rounded-full" />
        <div className="w-20 h-2 bg-white/5 rounded-full" />
      </div>
    </div>
    <div className="space-y-3 mb-6">
      <div className="w-full h-3 bg-white/5 rounded-full" />
      <div className="w-4/5 h-3 bg-white/5 rounded-full" />
    </div>
    <div className="w-full h-64 bg-white/5 rounded-3xl" />
    <div className="mt-6 flex gap-6">
      <div className="w-16 h-4 bg-white/5 rounded-full" />
      <div className="w-16 h-4 bg-white/5 rounded-full" />
    </div>
  </div>
);

export const SkeletonWidget = () => (
  <div className="bg-[#050B14] border border-white/5 rounded-3xl p-6 space-y-4 animate-pulse">
    <div className="w-24 h-3 bg-white/10 rounded-full mb-2" />
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="w-2/3 h-2 bg-white/5 rounded-full" />
            <div className="w-1/3 h-1.5 bg-white/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonFeed = () => {
  return (
    <div className="w-full space-y-px">
        <div className="px-4 py-8 flex gap-4 overflow-hidden border-b border-white/5">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonStory key={i} />)}
        </div>
        {[1, 2, 3].map(i => <SkeletonPost key={i} />)}
    </div>
  );
};
