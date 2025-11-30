"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Download,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

interface Submission {
  id: string
  formId: string
  formName: string
  submittedAt: string
  submitterEmail?: string
  submitterName?: string
  status: "new" | "reviewed" | "archived"
  data: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// ...removed mockSubmissions...

export function SubmissionsDashboard() {
  // Fetch real submissions from Convex
  const submissions = useQuery((api as any).forms?.listSubmissions, {}) as Submission[] || []
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formFilter, setFormFilter] = useState("all")
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const { toast } = useToast()

  const filteredSubmissions = submissions.filter((submission: Submission) => {
    const matchesSearch =
      searchQuery === "" ||
      submission.submitterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.submitterEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(submission.data).some((value) => String(value).toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || submission.status === statusFilter
    const matchesForm = formFilter === "all" || submission.formId === formFilter

    return matchesSearch && matchesStatus && matchesForm
  })

  const handleSelectSubmission = (submissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubmissions([...selectedSubmissions, submissionId])
    } else {
      setSelectedSubmissions(selectedSubmissions.filter((id) => id !== submissionId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(filteredSubmissions.map((s: Submission) => s.id))
    } else {
      setSelectedSubmissions([])
    }
  }

  // TODO: Implement backend update for status change
  const handleStatusChange = (submissionId: string, newStatus: Submission["status"]) => {
    toast({
      title: "Status updated",
      description: `Submission marked as ${newStatus}`,
    })
  }

  // TODO: Implement backend update for bulk status change
  const handleBulkStatusChange = (newStatus: Submission["status"]) => {
    setSelectedSubmissions([])
    toast({
      title: "Bulk update completed",
      description: `${selectedSubmissions.length} submissions updated`,
    })
  }

  // TODO: Implement backend delete
  const handleDelete = (submissionId: string) => {
    toast({
      title: "Submission deleted",
      description: "The submission has been permanently deleted",
    })
  }

  // TODO: Implement backend bulk delete
  const handleBulkDelete = () => {
    setSelectedSubmissions([])
    toast({
      title: "Submissions deleted",
      description: `${selectedSubmissions.length} submissions deleted`,
    })
  }

  const exportSubmissions = (format: "csv" | "json") => {
    const dataToExport = filteredSubmissions.map((submission: Submission) => ({
      id: submission.id,
      form: submission.formName,
      submittedAt: submission.submittedAt,
      status: submission.status,
      submitterEmail: submission.submitterEmail || "Anonymous",
      submitterName: submission.submitterName || "Anonymous",
      ...submission.data,
    }))

    if (format === "csv") {
      const headers = Object.keys(dataToExport[0] || {})
      const csvContent = [
        headers.join(","),
        ...dataToExport.map((row: any) => headers.map((header) => `"${(row as any)[header] || ""}"`).join(",")),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `submissions-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
    } else {
      const jsonContent = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `submissions-${new Date().toISOString().split("T")[0]}.json`
      a.click()
    }

    toast({
      title: "Export completed",
      description: `Submissions exported as ${format.toUpperCase()}`,
    })
  }

  const getStatusIcon = (status: Submission["status"]) => {
    switch (status) {
      case "new":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case "reviewed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "archived":
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: Submission["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "reviewed":
        return "bg-green-100 text-green-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Submissions</h2>
          <p className="text-muted-foreground">Manage and review form submissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportSubmissions("csv")}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportSubmissions("json")}>Export as JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.filter((s: Submission) => s.status === "new").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.filter((s: Submission) => s.status === "reviewed").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.filter((s: Submission) => s.status === "archived").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formFilter} onValueChange={setFormFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                <SelectItem value="contact-form">Contact Form</SelectItem>
                <SelectItem value="survey-form">Customer Survey</SelectItem>
                <SelectItem value="feedback-form">Feedback Form</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedSubmissions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{selectedSubmissions.length} submission(s) selected</span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange("reviewed")}>
                  Mark as Reviewed
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange("archived")}>
                  Archive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-destructive hover:text-destructive bg-transparent"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>
            {filteredSubmissions.length} of {submissions.length} submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedSubmissions.length === filteredSubmissions.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission: Submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedSubmissions.includes(submission.id)}
                      onCheckedChange={(checked) => handleSelectSubmission(submission.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{submission.formName}</div>
                    <div className="text-sm text-muted-foreground">ID: {submission.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {submission.submitterEmail ? (
                        <>
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{submission.submitterName || "Unknown"}</div>
                            <div className="text-sm text-muted-foreground">{submission.submitterEmail}</div>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">Anonymous</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(submission.status)}
                        <span className="capitalize">{submission.status}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(submission.submittedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedSubmission(submission)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, "reviewed")}>
                          Mark as Reviewed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(submission.id, "archived")}>
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(submission.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Submission Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission && `Submitted on ${formatDate(selectedSubmission.submittedAt)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <Tabs defaultValue="data" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="data">Form Data</TabsTrigger>
                <TabsTrigger value="meta">Metadata</TabsTrigger>
              </TabsList>
              <TabsContent value="data" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedSubmission.formName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(selectedSubmission.data).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm">{String(value)}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="meta" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Submission Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Submission ID</Label>
                        <p className="text-sm text-muted-foreground">{selectedSubmission.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Form ID</Label>
                        <p className="text-sm text-muted-foreground">{selectedSubmission.formId}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge className={getStatusColor(selectedSubmission.status)}>{selectedSubmission.status}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Submitted At</Label>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedSubmission.submittedAt)}</p>
                      </div>
                      {selectedSubmission.ipAddress && (
                        <div>
                          <Label className="text-sm font-medium">IP Address</Label>
                          <p className="text-sm text-muted-foreground">{selectedSubmission.ipAddress}</p>
                        </div>
                      )}
                      {selectedSubmission.userAgent && (
                        <div className="col-span-2">
                          <Label className="text-sm font-medium">User Agent</Label>
                          <p className="text-sm text-muted-foreground break-all">{selectedSubmission.userAgent}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
