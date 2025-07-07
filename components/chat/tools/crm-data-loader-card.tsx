'use client'

import React, { useState, useRef, useCallback, useMemo } from 'react'
import { useSfdcBatch } from '@/hooks/useSfdcBatch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Upload, FileText, MapPin, Play, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface FieldMapping {
  csvField: string
  salesforceField: string
  isRequired: boolean
}

interface DataLoaderProps {
    records?: Array<Record<string, any>>
    onComplete?: (result: any) => void
    borderless?: boolean // Optional prop to control border visibility
}

type LoaderStep = 'input' | 'mapping' | 'execution' | 'results'

export function CrmDataLoaderCard({ records, onComplete, borderless }: DataLoaderProps) {
  const { client, isLoading: sfdcLoading, error: sfdcError, describeGlobal, bulk, describeSobject } = useSfdcBatch()
  
  // State management
  const [currentStep, setCurrentStep] = useState<LoaderStep>('input')
  const [inputMethod, setInputMethod] = useState<'csv' | 'manual'>('csv')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<Array<Record<string, any>>>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [manualData, setManualData] = useState<string>('')
  
  // Salesforce configuration
  const [selectedObject, setSelectedObject] = useState<string>('')
  const [operation, setOperation] = useState<'insert' | 'update' | 'upsert' | 'delete'>('insert')
  const [externalIdField, setExternalIdField] = useState<string>('')
  const [timeout, setTimeout] = useState<number>(600000)
  
  // Field mapping
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get available Salesforce objects
  const availableObjects = useMemo(() => {
    if (!describeGlobal?.sobjects) return []
    return describeGlobal.sobjects
      .filter((obj: any) => obj.createable || obj.updateable)
      .map((obj: any) => ({
        name: obj.name,
        label: obj.label,
        createable: obj.createable,
        updateable: obj.updateable
      }))
      .sort((a: any, b: any) => a.label.localeCompare(b.label))
  }, [describeGlobal])

  // Get fields for selected object using describeSobject
  const [objectFields, setObjectFields] = useState<any[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function fetchFields() {
      if (!selectedObject) {
        setObjectFields([]);
        return;
      }
      setFieldsLoading(true);
      setFieldsError(null);
      try {
        const describeResult = await describeSobject(selectedObject);
        if (!cancelled && describeResult && Array.isArray(describeResult.fields)) {
          setObjectFields(describeResult.fields.map((field: any) => ({
            name: field.name,
            label: field.label,
            required: field.nillable === false && field.defaultedOnCreate === false,
            type: field.type
          })));
        }
      } catch (err) {
        if (!cancelled) setFieldsError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setFieldsLoading(false);
      }
    }
    fetchFields();
    return () => { cancelled = true; };
  }, [selectedObject]);

  // Parse CSV file
  const parseCsvFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
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
      
      setCsvHeaders(headers)
      setCsvData(data)
    }
    reader.readAsText(file)
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      parseCsvFile(file)
    }
  }, [parseCsvFile])

  // Parse manual data
  const parseManualData = useCallback(() => {
    try {
      const parsed = JSON.parse(manualData)
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCsvData(parsed)
        setCsvHeaders(Object.keys(parsed[0]))
      }
    } catch (error) {
      console.error('Failed to parse manual data:', error)
    }
  }, [manualData])

  // Initialize field mappings
  const initializeFieldMappings = useCallback(() => {
    if (csvHeaders.length === 0 || objectFields.length === 0) return
    
    const mappings: FieldMapping[] = csvHeaders.map(csvField => {
      // Try to find matching Salesforce field
      const matchingField = objectFields.find((field: { name: string; label: string }) => 
        field.name.toLowerCase() === csvField.toLowerCase() ||
        field.label.toLowerCase() === csvField.toLowerCase()
      )
      
      return {
        csvField,
        salesforceField: matchingField?.name || '',
        isRequired: matchingField?.required || false
      }
    })
    
    setFieldMappings(mappings)
  }, [csvHeaders, objectFields])

  // Update field mapping
  const updateFieldMapping = useCallback((csvField: string, salesforceField: string) => {
    setFieldMappings(prev => prev.map(mapping => 
      mapping.csvField === csvField 
        ? { ...mapping, salesforceField }
        : mapping
    ))
  }, [])

  // Transform data based on mappings
  const transformData = useCallback(() => {
    return csvData.map(record => {
      const transformed: Record<string, any> = {}
      fieldMappings.forEach(mapping => {
        if (mapping.salesforceField && record[mapping.csvField] !== undefined) {
          transformed[mapping.salesforceField] = record[mapping.csvField]
        }
      })
      return transformed
    })
  }, [csvData, fieldMappings])

  // Execute bulk operation
  const executeBulkOperation = useCallback(async () => {
    if (!client || !selectedObject || csvData.length === 0) return
    
    setIsExecuting(true)
    setExecutionError(null)
    
    try {
      const transformedData = transformData()
      
      const result = await bulk({
        type: 'ingest',
        sobjectType: selectedObject,
        operation,
        externalIdFieldName: operation === 'upsert' ? externalIdField : undefined,
        records: transformedData,
        timeout
      })
      
      setExecutionResult(result)
      setCurrentStep('results')
      onComplete?.(result)
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsExecuting(false)
    }
  }, [client, selectedObject, csvData, transformData, bulk, operation, externalIdField, timeout, onComplete])

  // Navigation helpers
  const canProceedToMapping = useMemo(() => {
    return csvData.length > 0 && selectedObject && csvHeaders.length > 0
  }, [csvData, selectedObject, csvHeaders])

  const canExecute = useMemo(() => {
    const validMappings = fieldMappings.filter(m => m.salesforceField)
    return validMappings.length > 0 && csvData.length > 0
  }, [fieldMappings, csvData])

  // Initialize mappings when prerequisites are met
  React.useEffect(() => {
    if (currentStep === 'mapping' && csvHeaders.length > 0 && objectFields.length > 0) {
      initializeFieldMappings()
    }
  }, [currentStep, csvHeaders, objectFields, initializeFieldMappings])

  // Parse passed records and display their headers in the data input section
  React.useEffect(() => {
    if (records && records.length > 0) {
      const sampleRecord = records[0];
      setCsvData(records);
      setCsvHeaders(Object.keys(sampleRecord));
    }
  }, [records]);

  if (sfdcLoading) {
    return (
      <Card className={`w-full max-w-4xl mx-auto ${borderless ? 'border-none' : ''}`}>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Loading Salesforce connection...
        </CardContent>
      </Card>
    )
  }

  if (sfdcError) {
    return (
      <Card className={`w-full max-w-4xl mx-auto ${borderless ? 'border-none' : ''}`}>
        <CardContent className="flex items-center justify-center p-8 text-red-600">
          <AlertCircle className="h-8 w-8 mr-2" />
          Error: {sfdcError}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-4xl mx-auto ${borderless ? 'border-none' : ''}`}>
      <CardHeader className='flex flex-row space-between'>
        {/* <CardTitle className="flex items-center flex-grow gap-2">
          <Upload className="h-5 w-5" />
          CRM Data Loader
        </CardTitle> */}
        
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {(['input', 'mapping', 'execution', 'results'] as LoaderStep[]).map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-md transition-all duration-300 ${
                  currentStep === step
                    ? 'bg-primary text-primary-foreground'
                    : index < (['input', 'mapping', 'execution', 'results'] as LoaderStep[]).indexOf(currentStep)
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < (['input', 'mapping', 'execution', 'results'] as LoaderStep[]).indexOf(currentStep) && (
                  <CheckCircle className="h-4 w-4" />
                )}
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </div>
              {index < 3 && <div className="w-4 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Step 1: Data Input */}
        {currentStep === 'input' && (
          <div className="space-y-6">
            {!records || (records && records.length == 0) && 
                <div>    
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Data Input</h3>
                        
                        {/* Input method selection */}
                        <div className="flex gap-2 mb-4">
                            <Button
                            variant={inputMethod === 'csv' ? 'default' : 'outline'}
                            onClick={() => setInputMethod('csv')}
                            className="flex items-center gap-2"
                            >
                            <FileText className="h-4 w-4" />
                            Upload CSV
                            </Button>
                            <Button
                            variant={inputMethod === 'manual' ? 'default' : 'outline'}
                            onClick={() => setInputMethod('manual')}
                            >
                            Manual Entry
                            </Button>
                        </div>
                        
                        {/* CSV Upload */}
                        {inputMethod === 'csv' && (
                            <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                />
                                <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                className="mb-2"
                                >
                                Choose CSV File
                                </Button>
                                {csvFile && (
                                <p className="text-sm text-gray-600">
                                    Selected: {csvFile.name} ({csvData.length} records)
                                </p>
                                )}
                            </div>
                            </div>
                        )}
                        
                        {/* Manual Entry */}
                        {inputMethod === 'manual' && (
                            <div className="space-y-4">
                            <textarea
                                value={manualData}
                                onChange={(e) => setManualData(e.target.value)}
                                placeholder="Enter JSON array of records..."
                                className="w-full h-32 p-3 border rounded-md"
                            />
                            <Button onClick={parseManualData} variant="outline">
                                Parse Data
                            </Button>
                            </div>
                        )}
                    </div>
                    
                    <Separator />
                </div>
            }
            
            
            {/* Salesforce Configuration */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Salesforce Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Object Type</label>
                  <Select value={selectedObject} onValueChange={setSelectedObject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select object..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableObjects.map((obj: any) => (
                        <SelectItem key={obj.name} value={obj.name}>
                          {obj.label} ({obj.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Operation</label>
                  <Select value={operation} onValueChange={(value: any) => setOperation(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insert">Insert</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="upsert">Upsert</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {operation === 'upsert' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">External ID Field</label>
                    <Select value={externalIdField} onValueChange={setExternalIdField}>
                      <SelectTrigger>
                        <SelectValue placeholder={fieldsLoading ? "Loading fields..." : "Select external ID field..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldsLoading && (
                          <SelectItem value="" disabled>Loading fields...</SelectItem>
                        )}
                        {fieldsError && (
                          <SelectItem value="" disabled>Error loading fields</SelectItem>
                        )}
                        {!fieldsLoading && !fieldsError && objectFields.map((field: any) => (
                          <SelectItem key={field.name} value={field.name}>
                            {field.label} ({field.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-2">Timeout (ms)</label>
                  <Input
                    type="number"
                    value={timeout}
                    onChange={(e) => setTimeout(Number(e.target.value))}
                    min="30000"
                    max="3600000"
                  />
                </div>
              </div>
            </div>
            
            {/* Data Preview */}
            {csvData.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Data Preview</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvHeaders.slice(0, 5).map(header => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                        {csvHeaders.length > 5 && <TableHead>...</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 3).map((record, index) => (
                        <TableRow key={`rowIndex${index}`}>
                          {csvHeaders.slice(0, 5).map(header => (
                            <TableCell key={`cell-${header}-${index}`} className="max-w-32 truncate">
                              {record[header]}
                            </TableCell>
                          ))}
                          {csvHeaders.length > 5 && <TableCell>...</TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {csvData.length > 3 && (
                    <div className="p-2 text-center text-sm text-gray-500 border-t">
                      ... and {csvData.length - 3} more records
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep('mapping')}
                disabled={!canProceedToMapping}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Configure Field Mapping
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 2: Field Mapping */}
        {currentStep === 'mapping' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Field Mapping</h3>
              <Button variant="outline" onClick={() => setCurrentStep('input')}>
                Back
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Map your CSV fields to Salesforce fields for {selectedObject}
              </p>
              {fieldsLoading && (
                <div className="p-2 text-center text-gray-500">Loading fields...</div>
              )}
              {fieldsError && (
                <div className="p-2 text-center text-red-600">Error loading fields: {fieldsError}</div>
              )}
              {!fieldsLoading && !fieldsError && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CSV Field</TableHead>
                        <TableHead>Salesforce Field</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Sample Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fieldMappings.map((mapping, index) => (
                        <TableRow key={mapping.csvField}>
                          <TableCell className="font-medium">{mapping.csvField}</TableCell>
                          <TableCell>
                            <Select
                              value={mapping.salesforceField}
                              onValueChange={(value) => updateFieldMapping(mapping.csvField, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select field..." />
                              </SelectTrigger>
                              <SelectContent>
                                {objectFields.map((field: any) => (
                                  <SelectItem key={field.name} value={field.name}>
                                    {field.label} ({field.name})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {mapping.isRequired && (
                              <Badge variant="destructive">Required</Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-32 truncate">
                            {csvData[0]?.[mapping.csvField]}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove mapping for ${mapping.csvField}`}
                              onClick={() => setFieldMappings(prev => prev.filter(m => m.csvField !== mapping.csvField))}
                            >
                              <span aria-hidden="true">✕</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep('execution')}
                disabled={!canExecute || fieldsLoading || !!fieldsError}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Execute
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Execution */}
        {currentStep === 'execution' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Execute Bulk Operation</h3>
              <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
                Back
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="font-medium mb-2">Operation Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Object:</strong> {selectedObject}</p>
                  <p><strong>Operation:</strong> {operation}</p>
                  <p><strong>Records:</strong> {csvData.length}</p>
                  <p><strong>Mapped Fields:</strong> {fieldMappings.filter(m => m.salesforceField).length}</p>
                  {operation === 'upsert' && externalIdField && (
                    <p><strong>External ID Field:</strong> {externalIdField}</p>
                  )}
                </div>
              </div>
              
              {executionError && (
                <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <strong>Error:</strong>
                  </div>
                  <p className="mt-1">{executionError}</p>
                </div>
              )}
              
              <div className="flex justify-center">
                <Button
                  onClick={executeBulkOperation}
                  disabled={isExecuting || !canExecute}
                  className="flex items-center gap-2"
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isExecuting ? 'Executing...' : 'Start Bulk Operation'}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 4: Results */}
        {currentStep === 'results' && executionResult && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Execution Results</h3>
            
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <strong>Operation Completed Successfully</strong>
              </div>
            </div>
            
            <div className="space-y-4">
              <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(executionResult, null, 2)}
              </pre>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => {
                setCurrentStep('input')
                setCsvData([])
                setCsvHeaders([])
                setFieldMappings([])
                setExecutionResult(null)
                setExecutionError(null)
              }}>
                Start New Operation
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
