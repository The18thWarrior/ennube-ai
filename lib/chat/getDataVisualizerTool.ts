import { ComponentConfigSchema } from "@/components/custom-response";
import { tool, generateObject, ToolExecutionOptions } from "ai";
import z from "zod";


// Tool: Get Fields
export const getDataVisualizerTool = (model: any) => {
    return tool({
        description: 'Call this tool when you have a database result that you want to generate a rendered output for the user. Input: { data: any }',
        async execute({ data }: { data?: any }, options: ToolExecutionOptions) {
            const { object } = await generateObject({
                model: model,
                schema: ComponentConfigSchema,
                prompt: `You will be provided a data base result that we want to generate a rendered output for the user.  You will be provided a json output that can be passed to the frontend for rendering. The following is the data: ${JSON.stringify(data)}. Assume the frontend page leverages tailwindcss.`,
            });
            return { output: object };
        },
        parameters: z.object({
            data: z.any().describe('The data to visualize or render for the user'),
        }),
    });
}
