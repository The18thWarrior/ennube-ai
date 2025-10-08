import { cn } from "@/lib/utils";
import { CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { WrenchIcon, ChevronDownIcon, Brain } from "lucide-react";
import { type } from "os";

interface PlanningProps {
  level: 'info' | 'warning' | 'error';
  message: string;
}

const PlanningComponent = ({level, message}: PlanningProps) => {
  return (
    <div className={cn("not-prose mb-4 inline-flex")}>
      <div
        className={cn(
          "flex w-full items-center justify-between gap-4 p-3 rounded-md border"
        )}
      >
        <div className="flex items-center gap-2 ">
          <Brain className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm">{message}</span>
        </div>
        
      </div>
    </div>
  );
};
export default PlanningComponent;