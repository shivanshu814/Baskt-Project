export interface PublicKeyTextProps {
  publicKey: string;
  className?: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface TruncatedTextProps {
  text: string;
  startChars?: number;
  endChars?: number;
  className?: string;
  copyOnClick?: boolean;
}
