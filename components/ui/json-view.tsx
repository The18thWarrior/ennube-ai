
"use client"

import dynamic from "next/dynamic";
import { useTheme } from "../theme-provider";
//import ReactJsonView from '@microlink/react-json-view'
// Dynamically import to avoid SSR issues
const ReactJsonView = dynamic(() => import("@microlink/react-json-view"), { ssr: false });

export interface JsonViewProps {
  data: any;
  classNames?: string;
}

export function JsonView({ data, classNames }: JsonViewProps) {
  const { theme } = useTheme();
  return (
    <span className={`min-w-full ${classNames}`}>
      {data && (
        <ReactJsonView
          src={data}
          name={null}
          theme={theme === "dark" ? "tomorrow" : "rjv-default"}
          collapsed={2}
          enableClipboard={true}
          onAdd={() => {return false;}}
          onDelete={() => {return false;}}
          onEdit={() => {return false;}}
          displayDataTypes={false}
          style={{ fontSize: 13 }}
        />
      )}
    </span>
  );
}
