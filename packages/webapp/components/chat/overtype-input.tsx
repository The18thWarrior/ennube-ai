"use client";

import React, { useEffect, useRef } from 'react';
import OverType from 'overtype';
import { useTheme } from '../theme-provider';

// Component props
interface OvertypeProps {
  input: string;
  handleInputChange: (e: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

/**
 * A small wrapper around the OverType editor.
 * Ensures safe initialization and keeps the editor in sync with `value`.
 */
export default function MarkdownEditor({ input, handleInputChange, handleSubmit, isLoading }: OvertypeProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!ref.current) return;

    // OverType.init may return an instance or an array [instance, ...].
    const result = OverType.init(ref.current, {
      value: input,
      onChange: (s: string) => {
        // Adapt OverType onChange to the project's change handler which expects an event.
        // Create a minimal synthetic event that contains a target with `value`.
        const syntheticEvent = {
          target: { value: s },
        } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
        try {
          handleInputChange(s);
        } catch (e) {
          // swallow handler errors to avoid breaking editor
        }
      },
      theme: theme.theme === 'dark' ? 'cave' : 'solar',
    });

    // Support both return shapes defensively
    const instance = Array.isArray(result) ? result[0] : result;
    editorRef.current = instance ?? null;

    return () => {
      try {
        editorRef.current?.destroy?.();
      } catch (e) {
        // swallow destroy errors silently - nothing we can do here
      }
      editorRef.current = null;
    };
    // We intentionally want to run this only once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    try {
      const current = editorRef.current;
      const getVal = typeof current.getValue === 'function' ? current.getValue() : null;
      if (input !== getVal && typeof current.setValue === 'function') {
        current.setValue(input);
      }
    } catch (e) {
      // ignore sync errors
    }
  }, [input]);

  // Keyboard handling: submit on Enter (without Shift)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const form = el.closest('form');
        console.log('form found', form)
        if (form) {
          // Create a synthetic submit event similar to chat-input behavior
          // @ts-ignore - constructing minimal event for handler
          handleSubmit({ target: form, currentTarget: form } as React.FormEvent<HTMLFormElement>);
          e.preventDefault();
        }
      }
    };

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [handleSubmit]);

  return (
    <div className={"relative flex-1"}>
       <form>
        <div ref={ref} className={"h-10"} />
      </form>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="text-white text-sm">Sending…</div>
        </div>
      )}
    </div>
  );
}