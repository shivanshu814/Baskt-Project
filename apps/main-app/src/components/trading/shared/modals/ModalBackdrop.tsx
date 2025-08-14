import { ModalBackdropProps } from '../../../../types/baskt/trading/modals';

export function ModalBackdrop({ children, onClose }: ModalBackdropProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900/95 backdrop-blur-sm border border-border rounded-lg p-6 w-full max-w-md mx-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-10 left-10 w-20 h-20 bg-red-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
