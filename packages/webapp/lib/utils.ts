import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  parse,
  HTMLElement,
  TextNode,
  Node as HtmlNode
} from 'node-html-parser';
import z from "zod";
import { SubscriptionStatus, Execution, UsageLogEntry } from "./types";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ListContext {
  type: 'ul' | 'ol' | null;
  level: number;
  index: number;
}

export function htmlToMarkdown(html: string): string {
  // parse the entire document
  const root = parse(html);
  // find the <body>, or fall back to root
  const body = root.querySelector('body') as HTMLElement || root;
  return nodeToMarkdown(body).trim();
}

function nodeToMarkdown(
  node: HtmlNode,
  listContext: ListContext = { type: null, level: 0, index: 0 }
): string {
  // Text node
  if (node instanceof TextNode) {
    return node.text.replace(/\s+/g, ' ');
  }

  // Element node
  if (!(node instanceof HTMLElement)) return '';

  const tag = node.tagName.toLowerCase();
  const childrenMd = node.childNodes
    .map(child => nodeToMarkdown(child, listContext))
    .join('');

  switch (tag) {
    case 'h1': return `# ${childrenMd}\n\n`;
    case 'h2': return `## ${childrenMd}\n\n`;
    case 'h3': return `### ${childrenMd}\n\n`;
    case 'h4': return `#### ${childrenMd}\n\n`;
    case 'h5': return `##### ${childrenMd}\n\n`;
    case 'h6': return `###### ${childrenMd}\n\n`;
    case 'p':  return `${childrenMd}\n\n`;
    case 'strong':
    case 'b':  return `**${childrenMd}**`;
    case 'em':
    case 'i':  return `*${childrenMd}*`;
    case 'a': {
      const href = node.getAttribute('href') || '';
      return `[${childrenMd}](${href})`;
    }
    case 'img': {
      const alt = node.getAttribute('alt') || '';
      const src = node.getAttribute('src') || '';
      return `![${alt}](${src})`;
    }
    case 'code': {
      if (node.parentNode instanceof HTMLElement
          && node.parentNode.tagName.toLowerCase() === 'pre') {
        return childrenMd; // will be fenced by the <pre> case
      }
      return `\`${childrenMd.trim()}\``;
    }
    case 'pre': {
      const codeChild = node.querySelector('code') as HTMLElement;
      const codeText = codeChild
        ? codeChild.text
        : node.text;
      return `\`\`\`\n${codeText.trim()}\n\`\`\`\n\n`;
    }
    case 'blockquote':
      return childrenMd
        .split('\n')
        .map(line => line ? `> ${line}` : '>')
        .join('\n') + '\n\n';
    case 'hr': return `---\n\n`;
    case 'br': return `  \n`;
    case 'ul':
    case 'ol': {
      const isOl = tag === 'ol';
      let idx = 1;
      return node.querySelectorAll('li').map(li => {
        const prefix = isOl ? `${idx++}. ` : '- ';
        const subMd = nodeToMarkdown(
          li,
          { type: tag as 'ul'|'ol', level: listContext.level + 1, index: idx }
        ).trim();
        const indent = '  '.repeat(listContext.level);
        return indent + prefix
          + subMd.replace(/\n/g, `\n${indent}  `);
      }).join('\n') + '\n\n';
    }
    case 'li':
      return node.childNodes
        .map(c => nodeToMarkdown(c, listContext))
        .join('');
    default:
      return childrenMd;
  }
}

export function isJson(str: string): boolean {
    try {
        const data = getJsonData(str);
        if (data === null || data === undefined) {
            return false;
        }        // If we reach here, the string is valid JSON
    } catch (e) {
        return false;
    }
    return true;
}

export function parseAndValidateResponse(jsonString: string, schema: z.ZodSchema): boolean {
  try {
    const parsedData = getJsonData(jsonString);
    // Use the Zod schema to parse and validate the data
    if (!parsedData) {
      console.log("Parsed data is null or undefined");
      return false;
    }
    const user = schema.parse(parsedData);
    return true;
  } catch (error) {
    console.log("JSON data does not match the expected schema:", error);
    return false;
  }
}

/**
 * Parses a string as JSON, supporting both raw JSON and JSON wrapped in ```json ... ``` code blocks.
 * Throws if parsing fails or format is not recognized.
 */
export function getJsonData(input: string): any {
  
  try {
    let jsonString = input.trim();
    // Check for code block with ```json ... ```
    const codeBlockMatch = jsonString.match(/^```json\s*([\s\S]*?)\s*```$/i);
    //console.log("codeBlockMatch", codeBlockMatch);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
    //throw new Error('Input is not valid JSON or JSON code block.');
  }
}

/**
 * Truncates a string or object with a length property to a specified max length, adding ellipsis if needed.
 * @param text The text or object with a length property to truncate
 * @param maxLength The maximum allowed length
 * @returns The truncated string (with ellipsis if truncated)
 */
export function truncateText(text: string, maxLength: number): string;
export function truncateText<T>(text: T[], maxLength: number): T[] | (T | string)[];
export function truncateText(text: any, maxLength: number): any {
  if (typeof text === 'string') {
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  }
  if (Array.isArray(text)) {
    return text.length > maxLength ? [...text.slice(0, maxLength), '…'] : text;
  }
  // fallback for objects with length
  if (text && typeof text === 'object' && typeof text.length === 'number') {
    return text.length > maxLength ? text.slice(0, maxLength) : text;
  }
  return text;
}

const agentImageMap: Record<string, string> = {
  "DataSteward": "/data-steward.png",
  "ProspectFinder": "/prospect-finder.png",
  "MeetingsBooker": "/meetings-booker.png",
  "MarketNurturer": "/market-nurturer.png",
  "ContractReader": "/contracts-reader.png"
}

const agentLinkMap: Record<string, string> = {
  "DataSteward": "/agents/data-steward",
  "ProspectFinder": "/agents/prospect-finder",
  "MeetingsBooker": "/agents/meetings-booker",
  "MarketNurturer": "/agents/market-nurturer",
  "ContractReader": "/agents/contract-reader",
}

export const getAgentImage = (agentName: string) => {
  if (agentName in agentImageMap) {
    return agentImageMap[agentName]
  }
  return "/data-steward.png" // Fallback image
}

export const getAgentLink = (agentName: string) => {
  if (agentName in agentLinkMap) {
    return agentLinkMap[agentName];
  }
  return "/agents/data-steward"; // Fallback link
}

const salesforceIdRegex = /^[a-zA-Z0-9]{15,18}$/;

export function isValidSalesforceId(id: string): boolean {
  return salesforceIdRegex.test(id);
}


export function getSubscriptionLimit(subscription: SubscriptionStatus | null): {
  usageLimit: number;
  isPro: boolean;
  isSubscribed: boolean;
  licenseCount: number;
} {
  if (!subscription) return { usageLimit: 100, isPro: false, isSubscribed: false, licenseCount: 0 };
  const isSubscribed = getIsSubscribed(subscription);
  const isPro = getIsPro(subscription);
  const usageLimit = isSubscribed ? (isPro ? 25000 : 2500) : 100;
  const licenseCount = subscription.items?.data[0]?.quantity || 0;

  return {
    usageLimit,
    isPro,
    isSubscribed,
    licenseCount
  };
}

function getIsPro(subscription: SubscriptionStatus | null): boolean {
  if (!subscription || !subscription.items || !subscription.items.data) return false;
  //console.log('Checking if user is Pro:', subscription);
  const isPro = subscription.items.data.some(item => {
    if (!item.price || !item.price.id) return false;
    return item.price?.id === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
  });
  return isPro;
}

function getIsSubscribed(subscription: SubscriptionStatus | null): boolean {
  if (!subscription) return false;

  const status = subscription.status;
  return status === 'active' || status === 'trialing';
}


export const mapUsageLogToExecution = (log: UsageLogEntry): Execution => {
  return {
        id: log.id,
        agent_name: log.agent,
        image_url: getAgentImage(log.agent),
        status: log.status || "unknown",
        execution_time: dayjs(log.updatedAt).diff(dayjs(log.createdAt), "seconds"),
        created_at: log.createdAt || dayjs(log.timestamp).toISOString(),
        response_data: log.responseData || {
          execution_summary: `Created ${log.recordsCreated} records and updated ${log.recordsUpdated} records`,
          error: null,
          error_code: null,
        },
  }
}