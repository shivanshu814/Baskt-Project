import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../providers/ThemeProvider';
import { Button } from '../components/src/button';
import { cn } from '@baskt/ui';

interface ThemeSwitchProps {
  className?: string;
}

export function ThemeSwitch({ className }: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className={cn('w-10 h-10 rounded-full transition-all duration-300', className)}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
