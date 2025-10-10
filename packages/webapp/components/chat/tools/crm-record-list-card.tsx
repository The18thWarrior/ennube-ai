"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ListChecks, User, Briefcase, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Column, CrmRecordListTable } from "./crm-record-list-table"
import { useTheme } from "@/components/theme-provider"

export interface CrmRecordSummary {
  id: string
  fields: {
      icon: React.ElementType
      label: string
      value: React.ReactNode
  }[],
  objectType: string
}

interface CrmRecordListData {
  records: CrmRecordSummary[]
  filterApplied?: string
  totalReturned: number
  selectRecord: (recordId: string) => void
  objectType?: string
}

export function CrmRecordListCard(data: CrmRecordListData) {
  const [viewTable, setViewTable] = useState(false)
  const [openRecords, setOpenRecords] = useState(false)
  const {theme} = useTheme() // Assuming you have a useTheme hook to get the current theme
  const FIELDS_SHOWN = 6
  const RECORDS_SHOWN = 5
  const handleRecordClick = (recordId: string) => {
    // In a real app, this might trigger a new chat message like "Show details for record [recordId]"
    // or open a modal, or navigate to a record page.
    console.log(`Record clicked: ${recordId}. Implement click-through action.`)
    // For now, we can't easily trigger a new message back to the useChat hook from here.
    // This would typically involve a more complex state management or callback prop.
    data.selectRecord(recordId)
  }

  const renderListTable = () => {
    let initialColumns: Column[] = [];
    if (data.records.length > 0) {
      const firstRecord = data.records[0];
      initialColumns = firstRecord.fields.filter((field) => field.label !== 'Id').map((field, idx) => ({
        id: field.label,
        label: field.label,
        field: field.label,
        width: 120,
        visible: idx < FIELDS_SHOWN,
        sortable: true,
        filterable: false,
        type: "text"
      }));
    }
    return <CrmRecordListTable title={""} initialColumns={initialColumns} records={data.records} onRecordSelect={handleRecordClick} />
  }

  return (
    <Card className="my-2 border-teal-500 min-w-[50vw]" style={{scrollbarWidth: 'none'}}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center justify-between">
          <span className="justify-start flex">
            <ListChecks className="mr-2 h-6 w-6 text-teal-500" />
            {`${data.objectType || "Records"}`}
          </span>
          <Button variant={theme === 'dark' ? 'ghost' : 'outline_green'} size="sm" onClick={() => setViewTable((prev) => !prev)}>
            {viewTable ? "Card View" : "Table View"}
          </Button>
        </CardTitle>
        {data.filterApplied && (
          <CardDescription>
            Filter: {data.filterApplied} ({data.totalReturned} records shown)
          </CardDescription>
        )}
      </CardHeader>
      {!viewTable && (
        <CardContent>
          {data.records.length === 0 ? (
            <p className="text-muted-foreground">No records found for this filter.</p>
          ) : (
            <ul className="space-y-2">
              {[data].map((data2) => {
                const firstField = 0; // Ensure we have at least one field
                const secondField = data2.records[0].fields.length > 2 ? 1 : 0; // Ensure we have a second field if possible
                const thirdField = data2.records[0].fields.length > 3 ? 2 : 0; // Ensure we have a third field if possible
                const displayed = data2.records.slice(0, RECORDS_SHOWN)
                const extra = data2.records.slice(RECORDS_SHOWN)
                return (
                  <div key={`record-list`}>
                    {displayed.map((record) => {
                      const FirstItemIcon = record.fields[firstField]?.icon || Briefcase;
                      const SecondItemIcon = record.fields[secondField]?.icon || User;
                      const firstFieldValue = record.fields.find(field => field.label.includes('Name') || field.label.includes('name')) ? record.fields.find(field => field.label.includes('Name') || field.label.includes('name'))?.value : typeof record.fields[firstField]?.value !== 'object' ? record.fields[firstField]?.value || "-" : record.fields[firstField]?.value ? Object.values(record.fields[firstField]?.value).at(0): '-';
                      const secondFieldValue = record.fields.find(field => field.label.includes('OwnerId') || field.label.includes('owner')) ? record.fields.find(field => field.label.includes('OwnerId') || field.label.includes('owner'))?.value : typeof record.fields[secondField]?.value !== 'object' ? record.fields[secondField]?.value || "-" : record.fields[secondField]?.value ? Object.values(record.fields[secondField]?.value).at(0): '-';
                      const thirdFieldValue = record.fields.find(field => field.label.includes('Type') || field.label.includes('type')) ? record.fields.find(field => field.label.includes('Type') || field.label.includes('type'))?.value :  typeof record.fields[thirdField]?.value !== 'object' ? record.fields[thirdField]?.value || "-" : record.fields[thirdField]?.value ? Object.values(record.fields[thirdField]?.value).at(0): '-';
                      const thirdFieldLabel = record.fields[thirdField]?.label || "Type";
                      
                      return (
                        <li key={record.id} className={"py-1"}>
                          <Button
                            variant="outline_neutral"
                            className="w-full justify-between items-center h-auto py-2 px-3 text-left"
                            onClick={() => handleRecordClick(record.id)}
                            title={`View details for ${record.fields.find(field => field.label.includes('Name') || field.label.includes('name') || field.label.includes('type') || field.label.includes('Type'))?.value}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate flex items-center">
                                {FirstItemIcon && <FirstItemIcon className="mr-2 h-3 w-3 text-muted-foreground flex-shrink-0" />} {firstFieldValue}
                              </p>
                              <p className="text-xs text-muted-foreground truncate flex items-center">
                                {false && SecondItemIcon && <SecondItemIcon className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />} {secondFieldValue}
                              </p>
                              <p className="text-xs text-muted-foreground">{thirdFieldLabel}: {thirdFieldValue}</p>
                            </div>
                            <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </Button>
                        </li>
                      )}
                    )}
                    {extra.length > 0 && (
                      <Collapsible open={openRecords} onOpenChange={setOpenRecords}>
                        <CollapsibleContent>
                          {extra.map((record) => {
                            const FirstItemIcon = record.fields[firstField]?.icon || Briefcase;
                            const SecondItemIcon = record.fields[secondField]?.icon || User;
                            const firstFieldValue = record.fields.find(field => field.label.includes('Name') || field.label.includes('name')) ? record.fields.find(field => field.label.includes('Name') || field.label.includes('name'))?.value : typeof record.fields[firstField]?.value !== 'object' ? record.fields[firstField]?.value || "-" : record.fields[firstField]?.value ? Object.values(record.fields[firstField]?.value).at(0): '-';
                            const secondFieldValue = record.fields.find(field => field.label.includes('OwnerId') || field.label.includes('owner')) ? record.fields.find(field => field.label.includes('OwnerId') || field.label.includes('owner'))?.value : typeof record.fields[secondField]?.value !== 'object' ? record.fields[secondField]?.value || "-" : record.fields[secondField]?.value ? Object.values(record.fields[secondField]?.value).at(0): '-';
                            const thirdFieldValue = record.fields.find(field => field.label.includes('Type') || field.label.includes('type')) ? record.fields.find(field => field.label.includes('Type') || field.label.includes('type'))?.value :  typeof record.fields[thirdField]?.value !== 'object' ? record.fields[thirdField]?.value || "-" : record.fields[thirdField]?.value ? Object.values(record.fields[thirdField]?.value).at(0): '-';
                            const thirdFieldLabel = record.fields[thirdField]?.label || "Type";
                            return (
                              <li key={`extra-${record.id}`} className={"py-1"}>
                                <Button
                                  variant="outline_neutral"
                                  className="w-full justify-between items-center h-auto py-2 px-3 text-left"
                                  onClick={() => handleRecordClick(record.id)}
                                  title={`View details for ${record.fields.find(field => field.label.includes('Name') || field.label.includes('name') || field.label.includes('type') || field.label.includes('Type'))?.value}`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate flex items-center">
                                      {FirstItemIcon && <FirstItemIcon className="mr-2 h-3 w-3 text-muted-foreground flex-shrink-0" />} {firstFieldValue}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate flex items-center">
                                      {false && SecondItemIcon && <SecondItemIcon className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />} {secondFieldValue}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{thirdFieldLabel}: {thirdFieldValue}</p>
                                  </div>
                                  <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </Button>
                              </li>
                            )
                          })}
                        </CollapsibleContent>
                        <div className="flex justify-center pt-2">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {openRecords ? "Show less" : `Show ${extra.length} more`}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </Collapsible>
                    )}
                  </div>
                )
              })}
            </ul>
          )}
        </CardContent>
      )}
      {viewTable && renderListTable()}
    </Card>
  )
}
