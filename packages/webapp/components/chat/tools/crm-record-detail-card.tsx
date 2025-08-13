"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import styles from './crm-record-detail-card.module.css';
import React from "react"
import { Separator } from "@/components/ui/separator"

// A small sub-component for displaying an editable field
const EditableField = ({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) => (
  <div className="flex items-start group">
    <Icon className="mr-3 h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-sm font-medium break-words">{children}</div>
    </div>
    {/* <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
    >
      <Pencil className="h-3 w-3" />
      <span className="sr-only">Edit {label}</span>
    </Button> */}
  </div>
)

// Main component props
interface CrmRecordDetailCardProps {
  icon: React.ElementType
  recordType: string
  title: string
  subtitle?: string
  fields: {
    icon: React.ElementType
    label: string
    value: React.ReactNode
  }[]
  updatedAt?: number
  notes?: string
  htmlBody?: string
  showListButton?: boolean
  listButtonText?: string
  goToList?: () => void
}

export function CrmRecordDetailCard({
  icon: RecordIcon,
  recordType,
  title,
  subtitle,
  fields,
  notes,
  htmlBody,
  updatedAt,
  showListButton,
  listButtonText,
  goToList
}: CrmRecordDetailCardProps) {
  const [open, setOpen] = React.useState(false)
  const FIELDS_SHOWN = 6
  const hasExtraFields = fields.length > FIELDS_SHOWN
  console.log(fields)
  return (
    <Card className="my-2 border-purple-500 w-full max-w-md flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {showListButton && 
            <Button variant='ghost' size="sm" className={'w-fit'} onClick={goToList}>{listButtonText || 'Back to List'}</Button>
          }
          {/* {
            <CrmDataLoaderModal
              triggerLabel="Load Data"
              triggerClassName="w-fit"
              records={[fields.reduce((acc, field) => {
                acc[field.label] = field.value;
                return acc;
              }, {} as Record<string, any>)]}
            />
          } */}
        </div>
        <Separator />
        <CardTitle className="text-xl flex items-center">
          <RecordIcon className="mr-2 h-6 w-6 text-purple-500 flex-shrink-0" />
          <span className="truncate">
            {recordType}: {title}
          </span>
        </CardTitle>
        {subtitle && <CardDescription className="truncate">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <Collapsible open={open} onOpenChange={setOpen}>
          {/* Always show the first 6 fields */}
          {fields.filter(field => typeof field.value !== 'object').slice(0, FIELDS_SHOWN).map((field, index) => (
            <EditableField key={index} icon={field.icon} label={field.label}>
              {field.value}
            </EditableField>
          ))}
          {/* Collapsible for extra fields */}
          {hasExtraFields && (
            <CollapsibleContent
              className={`${styles.CollapsibleContent} data-[state=closed]:max-h-0 data-[state=open]:max-h-content`}
            >
              {fields.slice(FIELDS_SHOWN).map((field, index) => (
                <EditableField key={FIELDS_SHOWN + index} icon={field.icon} label={field.label}>
                  {field.value}
                </EditableField>
              ))}
            </CollapsibleContent>
          )}
          {/* Updated at timestamp */}
          {updatedAt && (
            <div className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(updatedAt).toLocaleString()}
            </div>
          )}
          {/* Expand/collapse button */}
          {hasExtraFields && (
            <div className="flex justify-center pt-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {open ? "Show less" : `Show ${fields.length - FIELDS_SHOWN} more`}
                </Button>
              </CollapsibleTrigger>
            </div>
          )}
        </Collapsible>
        {/* Email body section */}
        {/*htmlBody && (
          <div className="mt-auto pt-4">
            <h4 className="text-sm font-semibold flex items-center mb-1">Email Body</h4>
            <div
              className="prose prose-sm max-w-none p-2 border rounded-md bg-muted text-foreground"
              dangerouslySetInnerHTML={{ __html: htmlBody }}
            />
          </div>
        )*/}
        {/* Notes section */}
        {/*notes !== undefined && !htmlBody && (
          <div className="mt-auto pt-4">
            <div className="flex items-center group mb-1">
              <h4 className="text-sm font-semibold flex items-center">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                Notes
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <Pencil className="h-3 w-3" />
                <span className="sr-only">Edit Notes</span>
              </Button>
            </div>
            {notes ? (
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md whitespace-pre-wrap">{notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic p-2">No notes added.</p>
            )}
          </div>
        )*/}
      </CardContent>
    </Card>
  )
}
