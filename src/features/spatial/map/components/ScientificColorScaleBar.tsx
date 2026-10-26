import React from 'react';

interface ScientificColorScaleBarProps {
  leftLabel: string;
  leftClass?: string;
  midLabel?: string;
  midClass?: string;
  rightLabel: string;
  rightClass?: string;
  gradient: string;
  subLeft: string;
  subRight: string;
  subRightClass?: string;
}

export function ScientificColorScaleBar({
  leftLabel,
  leftClass = 'text-slate-300',
  midLabel,
  midClass = 'text-slate-400',
  rightLabel,
  rightClass = 'text-slate-300',
  gradient,
  subLeft,
  subRight,
  subRightClass = 'text-cyan-300',
}: ScientificColorScaleBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className={leftClass}>{leftLabel}</span>
        {midLabel && <span className={midClass}>{midLabel}</span>}
        <span className={rightClass}>{rightLabel}</span>
      </div>
      <div
        className="w-full h-2.5 rounded-sm border border-slate-700 shadow-inner"
        style={{ background: gradient }}
      />
      <div className="flex items-center justify-between text-[9px] text-slate-400">
        <span>{subLeft}</span>
        <span className={subRightClass}>{subRight}</span>
      </div>
    </div>
  );
}
