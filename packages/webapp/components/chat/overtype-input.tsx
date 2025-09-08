
"use client";
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import OverType from 'overtype';
import { useTheme } from '../theme-provider';
import './overtype-input.module.css'

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
    if (theme.theme === 'dark') {
      // Make textarea invisible but keep the cursor
      console.log(editorRef.current);
      if (editorRef.current?.instanceTheme !== 'cave') {
        editorRef.current?.destroy?.();
        editorRef.current = null;
        initializeEditor();
      }
    } else if (theme.theme === 'light') {
      console.log(editorRef.current);
      if (editorRef.current?.instanceTheme !== 'solar') {
        editorRef.current?.destroy?.();
        editorRef.current = null;
        initializeEditor();
      }
    }
  }, [theme.theme]);

  useEffect(() => {
    if (!ref.current) return;

    initializeEditor();

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

  const customThemes = {
    valentine: {
      bgPrimary: '#ffe0ec',
      text: '#880e4f',
      h1: '#e91e63',
      h2: '#f06292',
      strong: '#e91e63',
      em: '#f06292'
    },
    aqua: {
      bgPrimary: '#e0f7fa',
      text: '#006064',
      h1: '#00acc1',
      h2: '#26c6da',
      strong: '#00acc1',
      em: '#26c6da'
    },
    mint: {
      bgPrimary: '#e8f5e9',
      text: '#1b5e20',
      h1: '#4caf50',
      h2: '#66bb6a',
      strong: '#4caf50',
      em: '#66bb6a'
    },
    galaxy: {
      bgPrimary: '#1a1a2e',
      bgSecondary: '#16213e',
      text: '#eaeaea',
      h1: '#f39c12',
      h2: '#e74c3c',
      strong: '#3498db',
      em: '#9b59b6'
    },
    pastel: {
      bgPrimary: '#ffeaa7',
      text: '#2d3436',
      h1: '#fd79a8',
      h2: '#a29bfe',
      strong: '#fd79a8',
      em: '#a29bfe'
    }
  }

  const initializeEditor = () => {
    //if (!ref.current) return;
    //#ts-ignore
    // OverType.init may return an instance or an array [instance, ...].
    const result = OverType.init(ref.current, {
      value: input,
      borderRadius: '.4rem',
      textareaProps: {
        className: `rounded-md border border-gray-300 dark:border-gray-600 `
      },
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
      theme: theme.theme === 'dark' ? 'cave' : 'aqua',
    });

    // Support both return shapes defensively
    const instance = Array.isArray(result) ? result[0] : result;
    editorRef.current = instance ?? null;
  };

  

  // useLayoutEffect(() => {
  //   if (!ref.current) return;
  //   //#ts-ignore
  //   const [instance] = new OverType(ref.current, {
  //     value: input,
  //     onChange: (s: string) => {
  //       // Adapt OverType onChange to the project's change handler which expects an event.
  //       // Create a minimal synthetic event that contains a target with `value`.
  //       const syntheticEvent = {
  //         target: { value: s },
  //       } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
  //       try {
  //         handleInputChange(s);
  //       } catch (e) {
  //         // swallow handler errors to avoid breaking editor
  //       }
  //     },
  //     theme: theme.theme === 'dark' ? 'cave' : 'solar',
  //   });
    
  //   editorRef.current = instance;
    
  //   return () => {
  //     instance.destroy();
  //   };
  // }, []); // Only on mount/unmount
  
  // // Handle controlled value updates
  // useEffect(() => {
  //   if (editorRef.current && input !== editorRef.current.getValue()) {
  //     editorRef.current.setValue(input);
  //   }
  // }, [input]);
  
  // // Handle prop updates (theme, toolbar, etc)
  // useEffect(() => {
  //   if (editorRef.current) {
  //     editorRef.current.reinit({ toolbar, theme, autoResize });
  //   }
  // }, [toolbar, theme, autoResize]);

  return (
    <div className={"relative flex-1"}>
       <form>
        <div ref={ref} className={"rounded-md border border-gray-300 dark:border-gray-600"} />
      </form>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <div className="text-white text-sm">Sending…</div>
        </div>
      )}
    </div>
  );
}


