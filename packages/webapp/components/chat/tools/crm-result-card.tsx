"use client"
import React, { useState, useCallback } from "react"
import { CrmRecordListCard } from "./crm-record-list-card"
import { CrmRecordDetailCard } from "./crm-record-detail-card"
import { RecordIcon, RecordType } from "./icon-map"

// Types from crm-record-list-card
interface CrmRecordSummary {
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
  objectType: string
  customLabel? : boolean
}

export function CrmResultCard(props: CrmRecordListData) {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [flip, setFlip] = useState(false)
    const [flipping, setFlipping] = useState(false)

    // Find the selected record
    const selectedRecord = props.records.find(r => r.id === selectedId)
    //console.log('Selected Record:', selectedRecord)
    const filteredFields = selectedRecord?.fields.filter((field) => field.label !== 'Id' && field.value && field.label !== 'attributes').map((field) => ({
            label: field.label,
            value: field.value,
            icon: RecordIcon.getIcon('default'),
    }))
        
    // Flip animation logic (similar to agent-card)
    const handleSelectRecord = useCallback((recordId: string) => {
        setSelectedId(recordId)
        setFlipping(true)
        setTimeout(() => {setFlip(true); setTimeout(() => {setFlipping(false)}, 500)}, 50) // allow state to update before flipping
    }, [])

    const handleGoToList = useCallback(() => {
        setFlipping(true)
        setTimeout(() => {setFlip(false); setTimeout(() => { setSelectedId(null);setFlipping(false) }, 500);}, 50)
         // wait for flip animation
    }, [])
    return (
        <div
        className={`flip-card ${flip ? "flipped" : ""} ${flipping ? "overflow-hidden" : ""}`}
        style={{ perspective: "1000px"}}
        >
            <div
                className={`flip-card-inner w-full h-full min-w-[50vw] relative transition-transform duration-500`}
                style={{ transformStyle: "preserve-3d", transform: flip ? "rotateY(180deg)" : "rotateY(0deg)", position: 'relative' }}
            >
                {/* Front: List */}
                <div
                className={`flip-card-front ${flipping ? "absolute": "relative"} w-full backface-hidden `}
                style={{ backfaceVisibility: "hidden", position: 'relative', height: flip ? "0px" : "" }}
                >
                    <CrmRecordListCard
                        {...props}
                        objectType={props.objectType}
                        selectRecord={handleSelectRecord}
                    />
                </div>
                {/* Back: Detail */}
                <div
                className={`flip-card-back w-full backface-hidden ${flipping ? "absolute": "relative"}`}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: 'relative', height: !flip ? "0px" : "" }}
                >
                    {selectedRecord && (
                        <CrmRecordDetailCard
                            icon={RecordIcon.getIcon(selectedRecord.objectType as RecordType) || (() => null)}
                            recordType={selectedRecord.objectType || "Record"}
                            title={
                                selectedRecord.fields.find((field) => field.label === 'Name')?.value as string || 'Untitled'
                            }
                            subtitle={
                                'ID: ' + selectedRecord.fields.find((field) => field.label === 'Id' || field.label === 'id')?.value as string || 'Id not found'
                            }
                            fields={filteredFields || []}
                            // Optionally pass notes, htmlBody, etc. if available in your data
                            showListButton={true}
                            goToList={handleGoToList}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default CrmResultCard;
