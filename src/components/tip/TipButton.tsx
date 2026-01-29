"use client";

import React from "react";
import { Heart } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { useTipStore } from "@/store";
import type { Creator } from "@/types";

interface TipButtonProps extends Omit<ButtonProps, "onClick"> {
  creator: Creator;
  showLabel?: boolean;
}

export function TipButton({
  creator,
  showLabel = true,
  className,
  ...props
}: TipButtonProps) {
  const { openTipModal } = useTipStore();

  return (
    <Button
      onClick={() => openTipModal(creator)}
      className={className}
      {...props}
    >
      <Heart className="h-4 w-4" />
      {showLabel && <span className="ml-2">Tip</span>}
    </Button>
  );
}
