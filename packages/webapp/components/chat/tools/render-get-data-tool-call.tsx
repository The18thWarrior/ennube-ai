import { TriangleAlert, CircleCheck } from "lucide-react";
import { nanoid } from "nanoid";
import { useState, useEffect } from "react";
import { CrmRecordDetailCard } from "./crm-record-detail-card";
import CrmResultCard from "./crm-result-card";
import { RecordIcon } from "./icon-map";

const RenderGetDataToolCallComponent = ({args, result, theme}: {args: any, result: any, theme: 'dark' | 'light' | 'system'}) => {
    const {records, totalSize } = result?.results ? result.results : {records: null, totalSize: 0};
    const {sql} = result?.query ? result.query : {sql: ''};
    const [hide, setHide] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
      //console.log(`RenderGetDataToolCallComponent`, records, totalSize, result)

      setTimeout(() => {
        if (mounted) setHide(true);
      }, 5000);
      return () => {
        setMounted(false);
      };
    }, []);
    
    if ((!records || records.length === 0) && (totalSize === 0 || !totalSize)) {
        return (
            <div className={`flex items-center gap-2 text-xs text-muted-foreground border rounded  transition-all duration-3000 ease-in-out transition-discrete ${hide ? 'h-0 opacity-0' : 'block py-4 px-2 my-2'}`}>
                {<TriangleAlert className="h-4 w-4 text-red-500" />}
                <span>No data found</span>
            </div>
        )
    }

    if ((!records || records.length === 0) && totalSize && totalSize !== 0) {
        return (
          <div key="total-count" className={`w-full border rounded transition-all duration-3000 ease-in-out transition-discrete ${
                hide ? "h-0 opacity-0" : "block py-4 px-2 my-2"
              }`}>
            <div
              className={`flex items-center gap-2 text-xs text-muted-foreground `}
            >
              <CircleCheck className="h-4 w-4 text-green-500" />
              <div>Total count: {totalSize}</div>
            </div>

            <div className="text-xs text-muted-foreground pt-3">{sql}</div>
          </div>
        )
    }


    if (records.length === 1) {
        const fields = Object.keys(records[0]).filter((key) => key !== 'Id' && records[0][key] && key !== 'attributes').map((key) => ({
            label: key,
            value: records[0][key],
            icon: RecordIcon.getIcon('default'),
        }));
        // Render single record detail
        return (
            <div>
                <CrmRecordDetailCard icon={RecordIcon.getIcon(records[0].attributes.type)} recordType={records[0].attributes.type} title={records[0].Name} subtitle={`ID: ${records[0].Id}`} fields={fields} />
            </div>
        );
    }
    
    const convertedRecords = records.map((record: { [x: string]: any; Id?: any; attributes?: any; }) => ({
        id: record.Id || nanoid(),
        fields: Object.keys(record).filter((key) => record[key] && key !== 'attributes').map((key) => ({
            label: key,
            value: typeof record[key] === 'object' ? Object.keys(record[key]).filter((key2) => record[key] && key2 !== 'attributes').reduce((acc, key2) => {
              return {...acc, [key2]: record[key][key2]};
            }, {}) : record[key],
            icon: RecordIcon.getIcon('default'),
        })),
        objectType: record.attributes.type,
    }));
    // console.log(`RenderGetDataToolCallComponent`,records)
    //console.log(`RenderGetDataToolCallComponent`,convertedRecords)
    return (
        <div className="transition-all duration-300 ease-in-out" style={{ transitionProperty: 'width' }}>
            {/* <CrmRecordListView records={records} /> */}
            { <CrmResultCard
                records={convertedRecords}
                totalReturned={convertedRecords.length}
                filterApplied={args?.filter}
                objectType={args?.sobject}
            /> }
        </div>
    );
}
export default RenderGetDataToolCallComponent;