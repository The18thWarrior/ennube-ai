
import React from "react";
import { useSfdcId } from "@/hooks/useSfdcId";
import CrmResultCard from "@/components/chat/tools/crm-result-card";
import { SObject } from "jsforce";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CrmRecordDetailCard } from "../chat/tools/crm-record-detail-card";
import { RecordIcon, RecordType } from "../chat/tools/icon-map";
import { Button } from "../ui";

interface SfdcRecordCardProps {
  id: string;
  goBack?: () => void;
}

const ExecutionRecordDetailItem: React.FC<SfdcRecordCardProps> = ({ id, goBack }) => {
  const { record, loading, error, sobject, updatedAt } = useSfdcId(id);
  const filteredFields = record?.fields.filter((field) => field.label !== 'Id' && field.value && field.label !== 'attributes').map((field) => ({
            label: field.label,
            value: field.value,
            icon: RecordIcon.getIcon('default'),
  }))

  if (loading) return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Loading record...</CardTitle>
        {goBack && (
          <Button
            className="text-sm px-3 py-1 rounded ml-2" 
            variant='ghost'
            onClick={goBack}
          >
            ← Back to Execution
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">Please wait while we fetch the record details.</div>
      </CardContent>
    </Card>
  );

  if (error) return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Error</CardTitle>
        {goBack && (
          <Button
            className="text-sm px-3 py-1 rounded ml-2" 
            variant='ghost'
            onClick={goBack}
          >
            ← Back to Execution
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-red-500">{error}</div>
      </CardContent>
    </Card>
  );

  if (!record) return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>No record found</CardTitle>
        {goBack && (
          <Button
            className="text-sm px-3 py-1 rounded ml-2" 
            variant='ghost'
            onClick={goBack}
          >
            ← Back to Execution
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">The requested Salesforce record could not be found.</div>
      </CardContent>
    </Card>
  );

  if (!sobject) return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>SObject not found</CardTitle>
        {goBack && (
          <Button
            className="text-sm px-3 py-1 rounded ml-2" 
            variant='ghost'
            onClick={goBack}
          >
            ← Back to Execution
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground">The Salesforce object type for this record could not be determined.</div>
      </CardContent>
    </Card>
  );

  return (
    // <CrmResultCard
    //   records={[record]}
    //   totalReturned={1}
    //   objectType={sobject}
    // />
    <CrmRecordDetailCard
        icon={RecordIcon.getIcon(sobject as RecordType) || RecordIcon.getIcon('default')}
        recordType={record.objectType || "Record"}
        title={
            record.fields.find((field) => field.label === 'Name')?.value as string || 'Untitled'
        }
        subtitle={
            'ID: ' + record.fields.find((field) => field.label === 'Id')?.value as string || 'Id not found'
        }
        fields={filteredFields || []}
        // Optionally pass notes, htmlBody, etc. if available in your data
        showListButton={true}
        updatedAt={updatedAt}
        listButtonText="Back to Execution"
        goToList={goBack}
    />
  );
};

export default ExecutionRecordDetailItem;
