"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown, ShikiThemeContext } from "streamdown";
import { useTheme } from "../theme-provider";
import { CodeBlock } from "./code-block";
import { BundledLanguage } from "shiki";
import remarkGfm from "remark-gfm";
import { remarkSalesforceLinks } from "@/lib/remark-plugins";
import { useSfdcBatch } from "@/hooks/useSfdcBatch";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => {
    const { theme } = useTheme();
    const { instanceUrl } = useOnboardingStatus();
    console.log('Instance URL in Response:', instanceUrl);
    if (!instanceUrl) return null;
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
        remarkPlugins={[
          [remarkSalesforceLinks, { instanceUrl }],
          [remarkGfm, {}],
        ]}
        {...props}
      />
    )
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
