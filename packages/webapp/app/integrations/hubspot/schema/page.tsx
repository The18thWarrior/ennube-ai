"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SchemaProperty {
  name: string;
  label: string;
  type: string;
  fieldType: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  hidden?: boolean;
  calculated?: boolean;
}

interface ObjectSchema {
  name: string;
  properties: SchemaProperty[];
  [key: string]: any;
}

export default function HubspotSchemaPage() {
  const [activeTab, setActiveTab] = useState<string>("companies");
  const [companySchema, setCompanySchema] = useState<ObjectSchema | null>(null);
  const [contactSchema, setContactSchema] = useState<ObjectSchema | null>(null);
  const [selectedTimestampField, setSelectedTimestampField] = useState<string>("");
  const [initialTimestampField, setInitialTimestampField] = useState<string>("");
  const [isLoadingSchema, setIsLoadingSchema] = useState<boolean>(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch object schemas
  useEffect(() => {
    const fetchSchemas = async () => {
      setIsLoadingSchema(true);
      setError(null);

      try {
        // Fetch companies schema
        const companyResponse = await fetch("/api/hubspot/schema?objectType=companies");
        
        if (!companyResponse.ok) {
          throw new Error(`Failed to fetch companies schema: ${companyResponse.statusText}`);
        }
        const companyData = await companyResponse.json();
        if (companyData.status !== 'error') {
          setCompanySchema(companyData);
        }

        // Fetch contacts schema
        const contactResponse = await fetch("/api/hubspot/schema?objectType=contacts");
        if (!contactResponse.ok) {
          throw new Error(`Failed to fetch contacts schema: ${contactResponse.statusText}`);
        }
        const contactData = await contactResponse.json();
        if (contactData.status !== 'error') {
          setContactSchema(contactData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load schema data",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSchema(false);
      }
    };

    fetchSchemas();
  }, [toast]);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const response = await fetch("/api/hubspot/settings");
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.statusText}`);
        }
        const data = await response.json();
        setSelectedTimestampField(data.account_timestamp_field || "");
        setInitialTimestampField(data.account_timestamp_field || "");
      } catch (err) {
        console.error("Error fetching settings:", err);
        // Don't show toast for settings error, not critical
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  // Save timestamp field setting
  const handleSaveTimestampField = async () => {
    if (selectedTimestampField === initialTimestampField) {
      return; // No change to save
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/hubspot/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_timestamp_field: selectedTimestampField,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.statusText}`);
      }

      setInitialTimestampField(selectedTimestampField);
      toast({
        title: "Success",
        description: "Timestamp field mapping saved successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter properties to show only date/time fields for timestamp selection
  const getDateTimeProperties = (schema: ObjectSchema | null) => {
    if (!schema) return [];
    
    const filteredProperties = schema.properties.filter(
      (prop) => prop.type === "datetime" || prop.fieldType === "date" || prop.name.includes("date") || prop.name.includes("time")
    );
    return filteredProperties;
  };

  // Get properties for the current tab
  const getProperties = () => {
    const schema = activeTab === "companies" ? companySchema : contactSchema;
    if (!schema) return [];
    return schema.properties.sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">HubSpot Schema Mapping</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Timestamp Field</CardTitle>
            <CardDescription>
              Select a field from Companies to use as the timestamp field for account synchronization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSettings || isLoadingSchema ? (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading settings...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="timestamp-field">Timestamp Field</Label>
                    <Select
                      value={selectedTimestampField}
                      onValueChange={setSelectedTimestampField}
                    >
                      <SelectTrigger id="timestamp-field">
                        <SelectValue placeholder="Select a timestamp field" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySchema &&
                          getDateTimeProperties(companySchema).map((prop) => (
                            <SelectItem key={prop.name} value={prop.name}>
                              {prop.label || prop.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleSaveTimestampField}
                      disabled={selectedTimestampField === initialTimestampField || isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {selectedTimestampField && (
                  <p className="text-sm text-muted-foreground">
                    Changes to the <code>{selectedTimestampField}</code> field will trigger account synchronization.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HubSpot Object Properties</CardTitle>
            <CardDescription>
              View available properties for HubSpot objects that can be used in your integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSchema ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading schema information...</span>
              </div>
            ) : error ? (
              <div className="flex items-center p-4 border border-red-200 bg-red-50 rounded-md text-red-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            ) : (
              <Tabs defaultValue="companies" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="companies">Companies</TabsTrigger>
                  <TabsTrigger value="contacts">Contacts</TabsTrigger>
                </TabsList>

                <TabsContent value="companies">
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
                      <div className="col-span-3">Name</div>
                      <div className="col-span-3">Label</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-4">Description</div>
                    </div>
                    <div className="divide-y max-h-[500px] overflow-y-auto">
                      {companySchema &&
                        getProperties().map((prop) => (
                          <div
                            key={prop.name}
                            className="grid grid-cols-12 p-3 text-sm hover:bg-muted/50"
                          >
                            <div className="col-span-3 font-mono text-xs">{prop.name}</div>
                            <div className="col-span-3">{prop.label || prop.name}</div>
                            <div className="col-span-2">{prop.type || prop.fieldType}</div>
                            <div className="col-span-4 text-muted-foreground text-xs">
                              {prop.description || "No description available"}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contacts">
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-12 bg-muted p-3 text-sm font-medium">
                      <div className="col-span-3">Name</div>
                      <div className="col-span-3">Label</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-4">Description</div>
                    </div>
                    <div className="divide-y max-h-[500px] overflow-y-auto">
                      {contactSchema &&
                        getProperties().map((prop) => (
                          <div
                            key={prop.name}
                            className="grid grid-cols-12 p-3 text-sm hover:bg-muted/50"
                          >
                            <div className="col-span-3 font-mono text-xs">{prop.name}</div>
                            <div className="col-span-3">{prop.label || prop.name}</div>
                            <div className="col-span-2">{prop.type || prop.fieldType}</div>
                            <div className="col-span-4 text-muted-foreground text-xs">
                              {prop.description || "No description available"}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            These properties represent fields available in your HubSpot account that can be used for
            integration mapping.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
