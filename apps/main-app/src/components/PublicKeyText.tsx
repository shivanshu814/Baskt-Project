import React from "react";
import { cn } from "../lib/utils";
import { TruncatedText } from "./TruncatedText";

interface PublicKeyTextProps {
  publicKey: string;
  className?: string;
}

/**
 * Component to display a truncated public key with first 4 and last 4 characters
 * Includes hover effect and copy functionality
 */
export function PublicKeyText({ 
  publicKey, 
  className
}: PublicKeyTextProps) {
  if (!publicKey) return null;
  
  return (
    <TruncatedText
      text={publicKey}
      startChars={4}
      endChars={4}
      copyOnClick={true}
      className={cn("font-mono", className)}
    />
  );
}
