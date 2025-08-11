"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ListChecks, User, Briefcase, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Column, CrmRecordListTable } from "./crm-record-list-table"

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
  const FIELDS_SHOWN = 6
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
    <Card className="my-2 border-teal-500 max-w-5xl" style={{scrollbarWidth: 'none'}}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center justify-between">
          <span className="justify-start flex">
            <ListChecks className="mr-2 h-6 w-6 text-teal-500" />
            {`${data.objectType || "Records"}`}
          </span>
          <Button variant="link" size="sm" onClick={() => setViewTable((prev) => !prev)}>
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
                return (
                  <div key={Math.random()}>
                    {data2.records.map((record) => {
                      const FirstItemIcon = record.fields[firstField].icon || Briefcase;
                      const SecondItemIcon = record.fields[secondField].icon || User;
                      const firstFieldValue = record.fields.find(field => field.label.includes('Name') || field.label.includes('name')) ? record.fields.find(field => field.label.includes('Name') || field.label.includes('name'))?.value : record.fields[firstField].value || "-";
                      const secondFieldValue = record.fields.find(field => field.label.includes('OwnerId') || field.label.includes('owner')) ? record.fields.find(field => field.label.includes('OwnerId') || field.label.includes('owner'))?.value : record.fields[secondField].value || "-";
                      const thirdFieldValue = record.fields.find(field => field.label.includes('Type') || field.label.includes('type')) ? record.fields.find(field => field.label.includes('Type') || field.label.includes('type'))?.value : record.fields[thirdField].value || "-";
                      const thirdFieldLabel = record.fields[thirdField]?.label || "Type";
                      
                      return (
                        <li key={record.id}>
                          <Button
                            variant="outline"
                            className="w-full justify-between items-center h-auto py-2 px-3 text-left"
                            onClick={() => handleRecordClick(record.id)}
                            title={`View details for ${record.fields.find(field => field.label.includes('Name') || field.label.includes('name') || field.label.includes('type') || field.label.includes('Type'))?.value}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate flex items-center">
                                {FirstItemIcon && <FirstItemIcon className="mr-2 h-3 w-3 text-muted-foreground flex-shrink-0" />} {firstFieldValue}
                              </p>
                              <p className="text-xs text-muted-foreground truncate flex items-center">
                                {SecondItemIcon && <SecondItemIcon className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />} {secondFieldValue}
                              </p>
                              <p className="text-xs text-muted-foreground">{thirdFieldLabel}: {thirdFieldValue}</p>
                            </div>
                            <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </Button>
                        </li>
                      )}
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
