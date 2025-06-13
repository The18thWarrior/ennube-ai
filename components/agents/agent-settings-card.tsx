"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RotateCw, ArrowLeft } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { FrequencyType, ProviderType } from '@/lib/db/agent-settings-storage';
import useIntegrationConnections from '@/hooks/useIntegrationConnections';

interface AgentSettingsCardProps {
  agentId: string; // Identifier for the agent
  agentName: string; // Display name of the agent
  agentDescription?: string; // Optional description
  agentIcon?: React.ReactNode; // Optional custom icon
  onFlip?: () => void; // Callback function to flip back to the agent card
}

export function AgentSettingsCard({ 
  agentId, 
  agentName, 
  agentDescription,
  agentIcon = <Settings className="h-5 w-5" />,
  onFlip
}: AgentSettingsCardProps) {
  // State for agent settings
  const [isActive, setIsActive] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [provider, setProvider] = useState<ProviderType>('sfdc'); // Default provider
  const [batchSize, setBatchSize] = useState<number>(10); // Default batch size
  const [inputBatchSize, setInputBatchSize] = useState<string>("10"); // Local state for the input
  const [settingId, setSettingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get integration connection statuses
  const { 
    connections, 
    isLoading: isLoadingConnections,
    error: connectionsError
  } = useIntegrationConnections();

  // Add useEffect for debouncing the batch size input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const value = parseInt(inputBatchSize, 10);
      if (!isNaN(value) && value > 0 && value !== batchSize) {
        handleBatchSizeChange(value);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [inputBatchSize]);

  // Add useEffect to sync batchSize to inputBatchSize when batchSize changes
  useEffect(() => {
    setInputBatchSize(batchSize.toString());
  }, [batchSize]);

  // Update provider selection if current provider is not connected
  useEffect(() => {
    if (!isLoadingConnections && Object.keys(connections).length > 0) {
      // If current provider is not connected
      if (!connections[provider]) {
        // Find the first connected provider
        const firstConnectedProvider = Object.keys(connections).find(
          key => connections[key as ProviderType]
        ) as ProviderType | undefined;
        
        // If found, update the provider
        if (firstConnectedProvider && firstConnectedProvider !== provider) {
          setProvider(firstConnectedProvider);
          if (settingId) {
            // Save the change to the database
            handleProviderChange(firstConnectedProvider);
          }
        }
      }
    }
  }, [connections, isLoadingConnections, provider, settingId]);

  // Fetch agent settings on component mount
  useEffect(() => {
    const fetchAgentSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/agents/settings?agent=${agentId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setIsActive(data.active);
            setFrequency(data.frequency);
            setBatchSize(data.batchSize || 10); // Use the provided batch size or default to 10
            setProvider(data.provider || 'sfdc'); // Use provided provider or default to sfdc
            setSettingId(data.id);
          } else {
            // No settings found, use defaults
            setIsActive(false);
            setFrequency('daily');
            setProvider('sfdc');
            setSettingId(null);
          }
        } else if (response.status === 404) {
          // No settings found, use defaults
          setIsActive(false);
          setFrequency('daily');
          setProvider('sfdc');
          setSettingId(null);
        } else {
          // Other error
          const errorData = await response.json();
          setError(errorData?.error || 'Failed to load agent settings');
          toast({
            title: "Error",
            description: errorData?.error || 'Failed to load agent settings',
            variant: "destructive"
          });
        }
      } catch (err) {
        setError('Network error while loading settings');
        toast({
          title: "Network Error",
          description: "Couldn't connect to server",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgentSettings();
  }, [agentId]);

  // Handle toggling active status
  const handleToggleActive = async () => {
    if (saving) return;
    
    setSaving(true);
    setError(null);
    
    try {
      let response;
      
      if (settingId) {
        // Update existing setting
        if (!isActive) {
          // If currently inactive, toggle it via PATCH endpoint
          response = await fetch(`/api/agents/settings?id=${settingId}&action=${'toggle'}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            }
          });
        } else {
          // If currently active, use PUT to update
          response = await fetch(`/api/agents/settings?id=${settingId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              active: !isActive
            })
          });
        }
      } else {
        // Create new setting
        response = await fetch('/api/agents/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent: agentId,
            active: !isActive,
            frequency: frequency,
            provider: provider
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.id) {
          setSettingId(data.id);
        }
        // Toggle the active state locally after successful API call
        setIsActive(!isActive);
        toast({
          title: "Success",
          description: `Agent ${!isActive ? "activated" : "deactivated"} successfully`,
        });
      } else {
        const errorData = await response.json();
        setError(errorData?.error || 'Failed to update agent status');
        toast({
          title: "Error",
          description: errorData?.error || 'Failed to update agent status',
          variant: "destructive"
        });
      }
    } catch (err) {
      setError('Network error while updating status');
      toast({
        title: "Network Error",
        description: "Couldn't connect to server",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle changing frequency
  const handleFrequencyChange = async (value: string) => {
    if (saving || !isValidFrequency(value)) return;
    
    setSaving(true);
    setError(null);
    
    try {
      let response;
      
      if (settingId) {
        // Update existing setting
        response = await fetch(`/api/agents/settings?id=${settingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            frequency: value
          })
        });
      } else {
        // Create new setting
        response = await fetch('/api/agents/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent: agentId,
            active: isActive,
            frequency: value,
            provider: provider
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.id) {
          setSettingId(data.id);
        }
        setFrequency(value as FrequencyType);
        toast({
          title: "Success",
          description: "Frequency updated successfully",
        });
      } else {
        const errorData = await response.json();
        setError(errorData?.error || 'Failed to update frequency');
        toast({
          title: "Error",
          description: errorData?.error || 'Failed to update frequency',
          variant: "destructive"
        });
      }
    } catch (err) {
      setError('Network error while updating frequency');
      toast({
        title: "Network Error",
        description: "Couldn't connect to server",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle changing provider
  const handleProviderChange = async (value: string) => {
    if (saving || !isValidProvider(value)) return;
    
    setSaving(true);
    setError(null);
    
    try {
      let response;
      
      if (settingId) {
        // Update existing setting
        response = await fetch(`/api/agents/settings?id=${settingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: value
          })
        });
      } else {
        // Create new setting
        response = await fetch('/api/agents/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent: agentId,
            active: isActive,
            frequency: frequency,
            provider: value
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.id) {
          setSettingId(data.id);
        }
        setProvider(value as ProviderType);
        toast({
          title: "Success",
          description: "Provider updated successfully",
        });
      } else {
        const errorData = await response.json();
        setError(errorData?.error || 'Failed to update provider');
        toast({
          title: "Error",
          description: errorData?.error || 'Failed to update provider',
          variant: "destructive"
        });
      }
    } catch (err) {
      setError('Network error while updating provider');
      toast({
        title: "Network Error",
        description: "Couldn't connect to server",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper function to validate frequency
  const isValidFrequency = (value: string): value is FrequencyType => {
    return ['business_hours', 'daily', 'weekly', 'monthly'].includes(value);
  };

  // Helper function to validate provider
  const isValidProvider = (value: string): value is ProviderType => {
    // Check if it's a valid provider type and also connected
    return ['sfdc', 'hubspot', 'gmail', 'msoffice'].includes(value) && 
      (!connections[value as ProviderType] ? false : true);
  };

  // Handle batch size change
  const handleBatchSizeChange = async (value: number) => {
    if (saving) return;
    
    setSaving(true);
    setError(null);
    
    try {
      let response;
      
      if (settingId) {
        // Update existing setting
        response = await fetch(`/api/agents/settings?id=${settingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batchSize: value
          })
        });
      } else {
        // Create new setting
        response = await fetch('/api/agents/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent: agentId,
            active: isActive,
            frequency: frequency,
            batchSize: value,
            provider: provider
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (data.id) {
          setSettingId(data.id);
        }
        setBatchSize(value);
        toast({
          title: "Success",
          description: "Batch size updated successfully",
        });
      } else {
        const errorData = await response.json();
        setError(errorData?.error || 'Failed to update batch size');
        toast({
          title: "Error",
          description: errorData?.error || 'Failed to update batch size',
          variant: "destructive"
        });
      }
    } catch (err) {
      setError('Network error while updating batch size');
      toast({
        title: "Network Error",
        description: "Couldn't connect to server",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Format frequency for display
  const formatFrequency = (freq: string): string => {
    switch (freq) {
      case 'business_hours':
        return 'Business Hours';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return freq;
    }
  };

  // Format provider for display
  const formatProvider = (prov: string): string => {
    switch (prov) {
      case 'sfdc':
        return 'Salesforce';
      case 'hubspot':
        return 'HubSpot';
      case 'gmail':
        return 'Gmail';
      case 'msoffice':
        return 'Microsoft Office';
      default:
        return prov;
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (loading) {
      return (
        <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Loading
        </Badge>
      );
    }
    
    if (isActive) {
      return (
        <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              {agentIcon}
            </div>
            <div>
              <CardTitle className="text-lg">{agentName}</CardTitle>
              {getStatusBadge()}
            </div>
          </div>
          <Switch 
            checked={isActive} 
            onCheckedChange={handleToggleActive}
            disabled={loading || saving || isLoadingConnections || Object.values(connections).every(v => !v)} 
            title={Object.values(connections).every(v => !v) ? "Connect an integration first" : ""}
          />
        </div>
        {agentDescription && false &&  (
          <CardDescription>{agentDescription}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {!isLoadingConnections && Object.values(connections).every(v => !v) && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <div className="flex items-center text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p className="text-sm">
                No integrations are connected. Please connect at least one integration in the Integrations section to use this agent.
              </p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="provider">Provider</Label>
            <Select 
              value={provider} 
              onValueChange={handleProviderChange}
              disabled={loading || saving || !isActive || isLoadingConnections || Object.values(connections).every(v => !v)}
            >
              <SelectTrigger id="provider">
                {isLoadingConnections ? (
                  <div className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    <span>Loading providers...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Select Provider">
                    {formatProvider(provider)}
                  </SelectValue>
                )}
              </SelectTrigger>
              <SelectContent>
                {isLoadingConnections ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Loading connections...</span>
                  </div>
                ) : Object.values(connections).some(v => v) ? (
                  <>
                    {connections.sfdc && <SelectItem value="sfdc">Salesforce</SelectItem>}
                    {connections.hubspot && <SelectItem value="hubspot">HubSpot</SelectItem>}
                    {connections.gmail && <SelectItem value="gmail">Gmail</SelectItem>}
                    {connections.msoffice && <SelectItem value="msoffice">Microsoft Office</SelectItem>}
                  </>
                ) : (
                  <div className="flex items-center justify-center py-2 text-amber-500">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>No connected integrations</span>
                  </div>
                )}
              </SelectContent>
            </Select>
            {!isLoadingConnections && Object.values(connections).every(v => !v) && (
              <p className="text-xs text-amber-500 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Please connect at least one integration
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="frequency">Run Frequency</Label>
            <Select 
              value={frequency} 
              onValueChange={handleFrequencyChange}
              disabled={loading || saving || !isActive}
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select Frequency">
                  {formatFrequency(frequency)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business_hours">Business Hours</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Provider selection is already included above */}
          
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="batchSize">Batch Size</Label>
            <Input
              id="batchSize"
              type="number"
              value={inputBatchSize}
              onChange={(e) => setInputBatchSize(e.target.value)}
              disabled={loading || saving || !isActive}
              className="bg-transparent text-foreground"
              min="1"
            />
          </div>
          
          {/* <div className="text-sm text-muted-foreground flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {settingId ? "Recently" : "Never"}
          </div> */}
        </div>
      </CardContent>
      {error && (
        <CardFooter className="pt-0">
          <div className="flex items-center text-red-500 text-sm">
            <AlertCircle className="h-4 w-4 mr-1" />
            {error}
          </div>
        </CardFooter>
      )}
      {saving && (
        <CardFooter className="pt-0">
          <div className="flex items-center text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Saving changes...
          </div>
        </CardFooter>
      )}
      {onFlip && (
        <CardFooter className="pt-4 pb-2 border-t">
          <div className="flex justify-start w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={onFlip}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to agent
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default AgentSettingsCard;
