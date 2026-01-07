"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"



import {
  Mail,
  Settings,
  TestTube,
  Table,
  CheckCircle,
  XCircle,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { copyToClipboard } from "@/lib/clipboard"

import { GoogleSheetsManager } from "./google-sheets-manager"
import { Integration } from "@/types/integration"

interface IntegrationsManagerProps {
  formId: string
  integrations: Integration[]
  onUpdateIntegrations: (integrations: Integration[]) => void
}

export function IntegrationsManager({ formId, integrations, onUpdateIntegrations }: IntegrationsManagerProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({})
  const { toast } = useToast()

  const integrationTemplates = [
    {
      type: "sheets" as const,
      name: "Google Sheets",
      icon: Table,
      description: "Export form submissions to Google Sheets",
      defaultConfig: {
        spreadsheetId: "",
        sheetName: "Form Submissions",
      },
    },
    {
      type: "email" as const,
      name: "Email Notification",
      icon: Mail,
      description: "Send email notifications on form submission",
      defaultConfig: {
        email: "",
        template: "New form submission from {{form_title}}\n\n{{submission_data}}",
      },
    },

  ]

  const addIntegration = (template: (typeof integrationTemplates)[number]) => {
    const newIntegration: Integration = {
      id: `integration-${Date.now()}`,
      name: template.name,
      type: template.type,
      enabled: false,
      config: template.defaultConfig,
      status: "pending",
    }

    onUpdateIntegrations([...integrations, newIntegration])
    setSelectedIntegration(newIntegration)
  }

  const updateIntegration = (integrationId: string, updates: Partial<Integration>) => {
    const updatedIntegrations = integrations.map((integration) =>
      integration.id === integrationId ? { ...integration, ...updates } : integration,
    )
    onUpdateIntegrations(updatedIntegrations)

    if (selectedIntegration?.id === integrationId) {
      setSelectedIntegration({ ...selectedIntegration, ...updates })
    }
  }

  const deleteIntegration = (integrationId: string) => {
    onUpdateIntegrations(integrations.filter((integration) => integration.id !== integrationId))
    if (selectedIntegration?.id === integrationId) {
      setSelectedIntegration(null)
    }
    toast({
      title: "Integration deleted",
      description: "The integration has been removed successfully",
    })
  }

  const testIntegration = async (integration: Integration) => {
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const success = Math.random() > 0.3 // 70% success rate for demo

      setTestResults((prev) => ({
        ...prev,
        [integration.id]: {
          success,
          message: success
            ? "Integration test successful! Data was sent correctly."
            : "Integration test failed. Please check your configuration.",
        },
      }))

      updateIntegration(integration.id, {
        status: success ? "active" : "error",
        lastTriggered: new Date().toISOString(),
      })

      toast({
        title: success ? "Test successful" : "Test failed",
        description: success ? "Your integration is working correctly" : "Please check your integration settings",
        variant: success ? "default" : "destructive",
      })
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [integration.id]: {
          success: false,
          message: "Network error occurred during testing",
        },
      }))
    }
  }

  const copyWebhookUrl = async (integration: Integration) => {
    if (integration.config.url) {
      const success = await copyToClipboard(integration.config.url)
      if (success) {
        toast({
          title: "URL copied",
          description: "Webhook URL has been copied to clipboard",
        })
      } else {
        toast({
          title: "Failed to copy",
          description: "Copy to clipboard is not supported in this browser. Please copy the URL manually.",
          variant: "destructive",
        })
      }
    }
  }

  const getStatusIcon = (status: Integration["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Settings className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: Integration["status"]) => {
    const variants = {
      active: "default",
      error: "destructive",
      pending: "secondary",
    } as const

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  const formTitle = "Test Form"
  const submissionData = {
    name: "John Doe",
    email: "john@example.com",
    message: "This is a test submission",
  }
  const submittedAt = new Date().toISOString()

  return (
    <div className="h-full flex overflow-hidden">
      {/* Integrations List */}
      <div className="w-80 border-r border-border bg-card flex-shrink-0 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Integrations</h3>
              <p className="text-xs text-muted-foreground">Connect your form to external services</p>
            </div>
          </div>

          {/* Add Integration Templates */}
          <div className="space-y-2 mb-4">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Integration</Label>
            {integrationTemplates.map((template) => {
              const Icon = template.icon
              return (
                <Button
                  key={template.type}
                  variant="outline"
                  className="w-full justify-start h-auto p-3 bg-transparent text-left"
                  onClick={() => addIntegration(template)}
                >
                  <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-sm break-words">{template.name}</div>
                    <div className="text-xs text-muted-foreground break-words whitespace-normal">{template.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>

          <Separator className="my-4" />

          {/* Active Integrations */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Active Integrations ({integrations.length})
            </Label>
            {integrations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No integrations configured yet. Add one above to get started.
              </p>
            ) : (
              integrations.map((integration) => {
                const template = integrationTemplates.find((t) => t.type === integration.type)
                const Icon = template?.icon || Settings

                return (
                  <Card
                    key={integration.id}
                    className={`cursor-pointer transition-colors ${selectedIntegration?.id === integration.id ? "ring-2 ring-primary" : ""
                      }`}
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium text-sm">{integration.name}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              {getStatusIcon(integration.status)}
                              {getStatusBadge(integration.status)}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={integration.enabled}
                          onCheckedChange={(enabled) => updateIntegration(integration.id, { enabled })}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Integration Configuration */}
      <div className="flex-1 overflow-hidden flex flex-col bg-card">
        {selectedIntegration ? (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="p-6 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedIntegration.name}</h2>
                  <p className="text-sm text-muted-foreground">Configure your {selectedIntegration.type} integration</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => testIntegration(selectedIntegration)}>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                  <Button variant="outline" onClick={() => deleteIntegration(selectedIntegration.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              <Tabs defaultValue="config" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                  <TabsTrigger value="testing">Testing</TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-6 mt-0">
                  {/* Google Sheets Configuration */}
                  {selectedIntegration.type === "sheets" && (
                    <GoogleSheetsManager
                      integration={selectedIntegration}
                      onUpdate={(updates) => updateIntegration(selectedIntegration.id, updates)}
                    />
                  )}

                  {/* Webhook Configuration */}
                  {selectedIntegration.type === "webhook" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="webhook-url">Webhook URL</Label>
                        <div className="flex space-x-2 mt-1">
                          <Input
                            id="webhook-url"
                            placeholder="https://your-api.com/webhook"
                            value={selectedIntegration.config.url || ""}
                            onChange={(e) =>
                              updateIntegration(selectedIntegration.id, {
                                config: { ...selectedIntegration.config, url: e.target.value },
                              })
                            }
                          />
                          <Button variant="outline" onClick={() => copyWebhookUrl(selectedIntegration)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="method">HTTP Method</Label>
                        <Select
                          value={selectedIntegration.config.method || "POST"}
                          onValueChange={(method: "POST" | "PUT" | "PATCH") =>
                            updateIntegration(selectedIntegration.id, {
                              config: { ...selectedIntegration.config, method },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="headers">Custom Headers (JSON)</Label>
                        <Textarea
                          id="headers"
                          placeholder='{"Authorization": "Bearer your-token", "Custom-Header": "value"}'
                          value={JSON.stringify(selectedIntegration.config.headers || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const headers = JSON.parse(e.target.value)
                              updateIntegration(selectedIntegration.id, {
                                config: { ...selectedIntegration.config, headers },
                              })
                            } catch {
                              // Invalid JSON, don't update
                            }
                          }}
                          rows={4}
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Configuration */}
                  {selectedIntegration.type === "email" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Notification Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="notifications@yourcompany.com"
                          value={selectedIntegration.config.email || ""}
                          onChange={(e) =>
                            updateIntegration(selectedIntegration.id, {
                              config: { ...selectedIntegration.config, email: e.target.value },
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="template">Email Template</Label>
                        <Textarea
                          id="template"
                          placeholder="New submission from {{form_title}}..."
                          value={selectedIntegration.config.template || ""}
                          onChange={(e) =>
                            updateIntegration(selectedIntegration.id, {
                              config: { ...selectedIntegration.config, template: e.target.value },
                            })
                          }
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Available variables: {formTitle}, {JSON.stringify(submissionData)}, {submittedAt}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Zapier Configuration */}
                  {selectedIntegration.type === "zapier" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="zapier-url">Zapier Webhook URL</Label>
                        <Input
                          id="zapier-url"
                          placeholder="https://hooks.zapier.com/hooks/catch/..."
                          value={selectedIntegration.config.url || ""}
                          onChange={(e) =>
                            updateIntegration(selectedIntegration.id, {
                              config: { ...selectedIntegration.config, url: e.target.value },
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Get this URL from your Zapier webhook trigger
                        </p>
                      </div>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <ExternalLink className="h-5 w-5 mt-0.5 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">Setup Instructions</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                1. Create a new Zap in Zapier
                                <br />
                                2. Choose "Webhooks by Zapier" as trigger
                                <br />
                                3. Copy the webhook URL and paste it above
                                <br />
                                4. Test the connection using the Test button
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Slack Configuration */}
                  {selectedIntegration.type === "slack" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="slack-url">Slack Webhook URL</Label>
                        <Input
                          id="slack-url"
                          placeholder="https://hooks.slack.com/services/..."
                          value={selectedIntegration.config.url || ""}
                          onChange={(e) =>
                            updateIntegration(selectedIntegration.id, {
                              config: { ...selectedIntegration.config, url: e.target.value },
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="slack-template">Message Template</Label>
                        <Textarea
                          id="slack-template"
                          placeholder="🎉 New form submission from {{form_title}}"
                          value={selectedIntegration.config.template || ""}
                          onChange={(e) =>
                            updateIntegration(selectedIntegration.id, {
                              config: { ...selectedIntegration.config, template: e.target.value },
                            })
                          }
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="testing" className="space-y-6 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Test Integration</CardTitle>
                      <CardDescription>
                        Send a test payload to verify your integration is working correctly
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => testIntegration(selectedIntegration)} className="w-full">
                        <TestTube className="h-4 w-4 mr-2" />
                        Send Test Data
                      </Button>

                      {testResults[selectedIntegration.id] && (
                        <div
                          className={`mt-4 p-4 rounded-lg border ${testResults[selectedIntegration.id].success
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                            }`}
                        >
                          <div className="flex items-center space-x-2">
                            {testResults[selectedIntegration.id].success ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {testResults[selectedIntegration.id].success ? "Success" : "Failed"}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{testResults[selectedIntegration.id].message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sample Payload</CardTitle>
                      <CardDescription>
                        This is the data structure that will be sent to your integration
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(
                          {
                            form_id: formId,
                            form_title: "Contact Form",
                            submission_data: {
                              name: "John Doe",
                              email: "john@example.com",
                              message: "Hello, this is a test message",
                            },
                            submitted_at: "2024-01-15T10:30:00Z",
                            user_agent: "Mozilla/5.0...",
                            ip_address: "192.168.1.1",
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-card">
            <div className="text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Integration Selected</h3>
              <p className="text-muted-foreground">Select an integration from the left panel to configure it</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
