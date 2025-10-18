'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSfdcBatch } from '@/hooks/useSfdcBatch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Loader2, Upload, Eye } from 'lucide-react'
import dayjs from 'dayjs'
import { Searcher } from 'fast-fuzzy'
import { BulkDataLoadMappingType } from '@/lib/types'

interface CrmDataLoaderToolCardProps {
  toolResult: BulkDataLoadMappingType
  onExecute?: (transformedData: Array<Record<string, any>>) => void
  className?: string
  borderless?: boolean
}

export function CrmDataLoaderToolCard({ toolResult, onExecute, borderless }: CrmDataLoaderToolCardProps) {
  const { describeSobject, bulk } = useSfdcBatch()

  // State for field metadata and CSV data
  const [objectFields, setObjectFields] = useState<any[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const [fieldsError, setFieldsError] = useState<string | null>(null)
  const [csvData, setCsvData] = useState<Array<Record<string, any>>>([])
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [transformedData, setTransformedData] = useState<Array<Record<string, any>>>([])
  const [isExecuting, setIsExecuting] = useState(false)

  // Fetch field metadata for the sobject
  useEffect(() => {
    let cancelled = false
    async function fetchFields() {
      if (!toolResult.sobject) return

      setFieldsLoading(true)
      setFieldsError(null)
      try {
        const { describe: describeResult } = await describeSobject(toolResult.sobject)
        if (!cancelled && describeResult && Array.isArray(describeResult.fields)) {
          setObjectFields(describeResult.fields)
        }
      } catch (err) {
        if (!cancelled) setFieldsError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setFieldsLoading(false)
      }
    }
    fetchFields()
    return () => { cancelled = true }
  }, [])

  // Fetch and parse CSV data
  useEffect(() => {
    let cancelled = false
    async function fetchCsvData() {
      if (!toolResult.fileUrl) return

      setCsvLoading(true)
      setCsvError(null)
      try {
        const response = await fetch(`/api/file?url=${encodeURIComponent(toolResult.fileUrl)}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status}`)
        }
        const alldata = await response.json()
        console.log('Fetched CSV arrayBuffer:', alldata)
        const csvText = alldata.data as string;//new TextDecoder().decode(alldata.data)
        const lines = csvText.split('\n').filter(line => line.trim())
        if (lines.length === 0) return

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const record: Record<string, any> = {}
          headers.forEach((header, index) => {
            record[header] = values[index] || ''
          })
          return record
        })

        if (!cancelled) {
          setCsvData(data)
        }
      } catch (err) {
        if (!cancelled) setCsvError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setCsvLoading(false)
      }
    }
    fetchCsvData()
    return () => { cancelled = true }
  }, [toolResult.fileUrl])

  // Transform data based on field mappings and types
  const transformedDataMemo = useMemo(() => {
    if (!csvData.length || !objectFields.length || !toolResult.mappings.length) return []

    return csvData.map(record => {
      const transformed: Record<string, any> = {}

      toolResult.mappings.forEach(mapping => {
        const csvValue = record[mapping.csvField]
        if (csvValue === undefined || csvValue === '') return

        const fieldMeta = objectFields.find(f => f.name === mapping.salesforceField)
        if (!fieldMeta) return

        let transformedValue: any = csvValue

        try {
          switch (fieldMeta.type) {
            case 'date':
              // Parse date and format as YYYY-MM-DD
              const dateValue = dayjs(csvValue)
              if (dateValue.isValid()) {
                transformedValue = dateValue.format('YYYY-MM-DD')
              }
              break

            case 'datetime':
              // Parse datetime and format as YYYY-MM-DD hh:mm:ss
              const dateTimeValue = dayjs(csvValue)
              if (dateTimeValue.isValid()) {
                transformedValue = dateTimeValue.format('YYYY-MM-DD HH:mm:ss')
              }
              break

            case 'time':
              // Parse time and format as hh:mm:ss.sssZ
              const timeValue = dayjs(csvValue)
              if (timeValue.isValid()) {
                transformedValue = timeValue.format('HH:mm:ss.SSSZ')
              }
              break

            case 'picklist':
            case 'multipicklist':
              // Use fast-fuzzy to find best match in picklist values
              if (fieldMeta.picklistValues && fieldMeta.picklistValues.length > 0) {
                const picklistOptions = fieldMeta.picklistValues.map((p: any) => p.value || p.label || '')
                const searcher = new Searcher(picklistOptions, {
                  threshold: 0.6,
                  ignoreCase: true,
                  ignoreSymbols: true
                })
                const matches = searcher.search(csvValue)
                if (matches.length > 0 && typeof matches[0] === 'object' && 'index' in matches[0]) {
                  transformedValue = fieldMeta.picklistValues[(matches[0] as any).index].value
                }
              }
              break

            case 'number':
            case 'currency':
            case 'percent':
              // Parse as number with appropriate precision
              const numValue = parseFloat(csvValue)
              if (!isNaN(numValue)) {
                const precision = fieldMeta.precision || fieldMeta.digits || 0
                const scale = fieldMeta.scale || 0
                transformedValue = parseFloat(numValue.toFixed(scale))
              }
              break

            case 'boolean':
              // Convert to boolean
              transformedValue = ['true', '1', 'yes', 'y'].includes(csvValue.toLowerCase())
              break

            default:
              // Keep as string for other types
              transformedValue = csvValue
              break
          }
        } catch (error) {
          console.warn(`Failed to transform value for field ${mapping.salesforceField}:`, error)
          // Keep original value if transformation fails
        }

        transformed[mapping.salesforceField] = transformedValue
      })

      return transformed
    })
  }, [csvData, objectFields, toolResult.mappings])

  // Update transformed data when memoized value changes
  useEffect(() => {
    setTransformedData(transformedDataMemo)
  }, [transformedDataMemo])

  // Execute the bulk operation
  const executeBulkOperation = async () => {
    if (!transformedData.length || !toolResult.sobject) return

    // Skip upsert operations as they require external ID field configuration
    if (toolResult.dmlOperation === 'upsert') {
      console.warn('Upsert operations are not supported in this preview. Use the full data loader for upsert operations.')
      return
    }

    setIsExecuting(true)
    try {
      const result = await bulk({
        type: 'ingest',
        sobjectType: toolResult.sobject,
        operation: toolResult.dmlOperation as 'insert' | 'update' | 'delete',
        records: transformedData
      })

      onExecute?.(transformedData)
    } catch (error) {
      console.error('Bulk operation failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  // Loading states
  if (fieldsLoading || csvLoading) {
    return (
      <Card className={`w-full max-w-4xl mx-auto ${borderless ? 'border-none' : ''}`}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Loading data and field metadata...
        </CardContent>
      </Card>
    )
  }

  // Error states
  if (fieldsError || csvError) {
    return (
      <Card className={`w-full max-w-4xl mx-auto ${borderless ? 'border-none' : ''}`}>
        <CardContent className="flex items-center justify-center p-8 text-red-600">
          <AlertCircle className="h-8 w-8 mr-2" />
          Error: {fieldsError || csvError}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-4xl mx-auto ${borderless ? 'border-none' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          CRM Data Loader Preview
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Operation Summary */}
        <div className="p-4 border rounded-lg bg-muted">
          <h4 className="font-medium mb-2">Operation Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Object:</strong> {toolResult.sobject}</p>
              <p><strong>Operation:</strong> {toolResult.dmlOperation}</p>
              <p><strong>Records:</strong> {csvData.length}</p>
            </div>
            <div>
              <p><strong>Mapped Fields:</strong> {toolResult.metadata.successfulMappings}</p>
              <p><strong>Total Headers:</strong> {toolResult.metadata.totalCsvHeaders}</p>
              <p><strong>Unmapped:</strong> {toolResult.metadata.unmappedHeaders.length}</p>
            </div>
          </div>
        </div>

        {/* Field Mappings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Field Mappings</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CSV Field</TableHead>
                  <TableHead>Salesforce Field</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toolResult.mappings.map((mapping, index) => {
                  const fieldMeta = objectFields.find(f => f.name === mapping.salesforceField)
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{mapping.csvField}</TableCell>
                      <TableCell>{mapping.salesforceField}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{mapping.dataType}</Badge>
                      </TableCell>
                      <TableCell>
                        {fieldMeta?.nillable === false && fieldMeta?.defaultedOnCreate === false ? (
                          <Badge variant="destructive">Required</Badge>
                        ) : (
                          <Badge variant="secondary">Optional</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Data Preview */}
        {transformedData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Data Preview (First 5 Records)</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {toolResult.mappings.map((mapping, index) => (
                      <TableHead key={index}>{mapping.salesforceField}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transformedData.slice(0, 5).map((record, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {toolResult.mappings.map((mapping, colIndex) => (
                        <TableCell key={colIndex} className="max-w-xs truncate">
                          {record[mapping.salesforceField] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {transformedData.length > 5 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing first 5 of {transformedData.length} records
              </p>
            )}
          </div>
        )}

        {/* Execute Button */}
        <div className="flex justify-end">
          {toolResult.dmlOperation === 'upsert' ? (
            <div className="text-sm text-muted-foreground">
              Upsert operations require external ID field configuration and are not supported in this preview.
              Use the full CRM Data Loader component for upsert operations.
            </div>
          ) : (
            <Button
              onClick={executeBulkOperation}
              disabled={isExecuting || !transformedData.length}
              className="flex items-center gap-2"
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isExecuting ? 'Executing...' : `Execute ${toolResult.dmlOperation} Operation`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}