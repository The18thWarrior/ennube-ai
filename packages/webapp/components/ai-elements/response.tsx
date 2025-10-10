"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown, ShikiThemeContext } from "streamdown";
import { useTheme } from "../theme-provider";
import { CodeBlock } from "./code-block";
import { BundledLanguage } from "shiki";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => {
    const { theme } = useTheme();
    return (
      <Streamdown
        className={cn(
          "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          className
        )}
        shikiTheme={theme === "lavender" ? ["github-dark", "github-dark"] : ["github-light", "github-dark"]}
        components={{
          //code: (codeProps) => <CodeBlock code={codeProps.content || ''} language={codeProps.datatype as BundledLanguage || 'plaintext'} />,
        }}
        {...props}
      />
    )
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
