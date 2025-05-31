/**
 * useModal - A reusable hook for modal open/close state
 */
import { useState, useCallback } from 'react';

export function useModal(initial: boolean = false) {
  const [open, setOpen] = useState(initial);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const toggleModal = useCallback(() => setOpen((v) => !v), []);
  return { open, openModal, closeModal, toggleModal, setOpen };
}
