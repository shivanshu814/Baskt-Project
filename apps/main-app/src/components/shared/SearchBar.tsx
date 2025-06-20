import { memo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@baskt/ui';
import { SearchBarProps } from '../../types/shared';

export const SearchBar = memo(({ value, onChange, placeholder = 'Search...' }: SearchBarProps) => (
  <div className="relative flex-grow">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
    <Input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-10"
    />
  </div>
));
