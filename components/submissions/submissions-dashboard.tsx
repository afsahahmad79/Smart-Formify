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
import { api } from "../../convex/_generated/api";

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
  Eye,
  Trash2,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useMutation } from "convex/react"
import type { Id } from "@/convex/_generated/dataModel"

interface Submission {
  id: string
  formId: string
  formName: string
  submittedAt: number
  submitterEmail?: string
  submitterName?: string
  status: "new" | "reviewed" | "archived" | string // Accept status values from backend
  data: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

// ...removed mockSubmissions...

export function SubmissionsDashboard() {
  // Fetch real submissions from Convex
  const submissions = useQuery(api.submissions.queries.listSubmissions, {}) ?? [];
  // Fetch user's forms for filter dropdown
  const formsResult = useQuery(api.forms.queries.listForms, { paginationOpts: { numItems: 1000, cursor: null } });
  const userForms = formsResult?.page ?? [];

  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formFilter, setFormFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all") // "all", "today", "week", "month", "year", "custom"
  const [customDateStart, setCustomDateStart] = useState<string>("")
  const [customDateEnd, setCustomDateEnd] = useState<string>("")
  const [sortField, setSortField] = useState<"submittedAt" | "formName" | "submitterName" | "status">("submittedAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null)
  const { toast } = useToast()

  // Mutations
  const updateSubmissionStatus = useMutation(api.submissions.mutations.updateSubmissionStatus)
  const deleteSubmission = useMutation(api.submissions.mutations.deleteSubmission)
  const bulkUpdateSubmissionStatus = useMutation(api.submissions.mutations.bulkUpdateSubmissionStatus)
  const bulkDeleteSubmissions = useMutation(api.submissions.mutations.bulkDeleteSubmissions)

  // Get unique forms for filter dropdown (from submissions and user forms)
  const uniqueForms = Array.from(
    new Map([
      ...(submissions as Submission[]).map((s) => [s.formId, { id: s.formId, name: s.formName }] as [string, { id: string; name: string }]),
      ...userForms.map((f) => [String(f._id), { id: String(f._id), name: f.title }] as [string, { id: string; name: string }])
    ]).values()
  )

  // Date filter helper
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (dateFilter) {
      case "today":
        return { start: today.getTime(), end: now.getTime() }
      case "week":
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { start: weekAgo.getTime(), end: now.getTime() }
      case "month":
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return { start: monthAgo.getTime(), end: now.getTime() }
      case "year":
        const yearAgo = new Date(today)
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)
        return { start: yearAgo.getTime(), end: now.getTime() }
      case "custom":
        const start = customDateStart ? new Date(customDateStart).getTime() : 0
        const end = customDateEnd ? new Date(customDateEnd).getTime() + 86400000 : Date.now() // Add 1 day to include the end date
        return { start, end }
      default:
        return { start: 0, end: Date.now() }
    }
  }

  const filteredSubmissions = (submissions as Submission[]).filter((submission) => {
    const matchesSearch =
      searchQuery === "" ||
      (submission.submitterName && submission.submitterName !== "Anonymous" && submission.submitterName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (submission.submitterEmail && submission.submitterEmail !== "Anonymous" && submission.submitterEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      submission.formName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (submission.data && Object.values(submission.data).some((value) => String(value).toLowerCase().includes(searchQuery.toLowerCase())))

    const matchesStatus = statusFilter === "all" || submission.status === statusFilter
    const matchesForm = formFilter === "all" || submission.formId === formFilter

    // Date filter
    const dateRange = getDateRange()
    const matchesDate = dateFilter === "all" ||
      (submission.submittedAt >= dateRange.start && submission.submittedAt <= dateRange.end)

    return matchesSearch && matchesStatus && matchesForm && matchesDate
  })

  // Sort filtered submissions
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case "submittedAt":
        aValue = a.submittedAt
        bValue = b.submittedAt
        break
      case "formName":
        aValue = a.formName.toLowerCase()
        bValue = b.formName.toLowerCase()
        break
      case "submitterName":
        aValue = (a.submitterName && a.submitterName !== "Anonymous" ? a.submitterName : a.submitterEmail || "Anonymous").toLowerCase()
        bValue = (b.submitterName && b.submitterName !== "Anonymous" ? b.submitterName : b.submitterEmail || "Anonymous").toLowerCase()
        break
      case "status":
        aValue = a.status
        bValue = b.status
        break
      default:
        return 0
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1
    }
    return 0
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
      setSelectedSubmissions(sortedSubmissions.map((s) => s.id))
    } else {
      setSelectedSubmissions([])
    }
  }

  const handleSort = (field: "submittedAt" | "formName" | "submitterName" | "status") => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to descending
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getSortIcon = (field: "submittedAt" | "formName" | "submitterName" | "status") => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1.5 opacity-40" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1.5 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1.5 text-primary" />
    )
  }

  // Handle status change
  const handleStatusChange = async (submissionId: string, newStatus: "new" | "reviewed" | "archived") => {
    // Prevent duplicate clicks
    if (isUpdatingStatus === submissionId) return

    setIsUpdatingStatus(submissionId)
    try {
      await updateSubmissionStatus({
        id: submissionId as Id<"submissions">,
        status: newStatus,
      })
      // Remove from selection if it was selected
      setSelectedSubmissions(prev => prev.filter(id => id !== submissionId))
      toast({
        title: "Status updated",
        description: `Submission marked as ${newStatus}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update submission status",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(null)
    }
  }

  // Handle bulk status change
  const handleBulkStatusChange = async (newStatus: "new" | "reviewed" | "archived") => {
    if (selectedSubmissions.length === 0) return

    try {
      await bulkUpdateSubmissionStatus({
        ids: selectedSubmissions as Id<"submissions">[],
        status: newStatus,
      })
      const count = selectedSubmissions.length
      setSelectedSubmissions([])
      toast({
        title: "Bulk update completed",
        description: `${count} submission(s) marked as ${newStatus}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update submissions",
        variant: "destructive",
      })
    }
  }

  // Handle delete
  const handleDelete = async (submissionId: string) => {
    // Prevent duplicate clicks
    if (isDeleting === submissionId) return

    // Confirmation dialog
    if (!confirm("Are you sure you want to delete this submission? This action cannot be undone.")) {
      return
    }

    setIsDeleting(submissionId)
    try {
      await deleteSubmission({
        id: submissionId as Id<"submissions">,
      })
      // Remove from selection if it was selected
      setSelectedSubmissions(prev => prev.filter(id => id !== submissionId))
      toast({
        title: "Submission deleted",
        description: "The submission has been permanently deleted",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete submission",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedSubmissions.length === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedSubmissions.length} submission(s)? This action cannot be undone.`)) {
      return
    }

    try {
      await bulkDeleteSubmissions({
        ids: selectedSubmissions as Id<"submissions">[],
      })
      const count = selectedSubmissions.length
      setSelectedSubmissions([])
      toast({
        title: "Submissions deleted",
        description: `${count} submission(s) deleted`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete submissions",
        variant: "destructive",
      })
    }
  }

  const exportSubmissions = (format: "csv" | "json") => {
    const dataToExport = sortedSubmissions.map((submission) => ({
      id: submission.id,
      form: submission.formName,
      submittedAt: new Date(submission.submittedAt).toLocaleString(),
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
      default:
        return <AlertCircle className="h-4 w-4 text-blue-600" />
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
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const formatDate = (dateValue: number) => {
    return new Date(dateValue).toLocaleString()
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
            <div className="text-2xl font-bold">{(submissions as Submission[]).filter((s) => s.status === "new").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(submissions as Submission[]).filter((s) => s.status === "reviewed").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(submissions as Submission[]).filter((s) => s.status === "archived").length}</div>
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
                {uniqueForms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
              const [field, direction] = value.split("-") as [typeof sortField, typeof sortDirection]
              setSortField(field)
              setSortDirection(direction)
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submittedAt-desc">Date (Newest First)</SelectItem>
                <SelectItem value="submittedAt-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="formName-asc">Form Name (A-Z)</SelectItem>
                <SelectItem value="formName-desc">Form Name (Z-A)</SelectItem>
                <SelectItem value="submitterName-asc">Submitter (A-Z)</SelectItem>
                <SelectItem value="submitterName-desc">Submitter (Z-A)</SelectItem>
                <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                <SelectItem value="status-desc">Status (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dateFilter === "custom" && (
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              <div className="flex-1">
                <Label htmlFor="date-start">Start Date</Label>
                <Input
                  id="date-start"
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="date-end">End Date</Label>
                <Input
                  id="date-end"
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedSubmissions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{selectedSubmissions.length} submission(s) selected</span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange("new")}>
                  Mark as New
                </Button>
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
            {sortedSubmissions.length} of {submissions.length} submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedSubmissions.length === sortedSubmissions.length && sortedSubmissions.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 hover:bg-accent"
                    onClick={() => handleSort("formName")}
                  >
                    <span className="flex items-center">
                      Form
                      {getSortIcon("formName")}
                    </span>
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 hover:bg-accent"
                    onClick={() => handleSort("submitterName")}
                  >
                    <span className="flex items-center">
                      Submitter
                      {getSortIcon("submitterName")}
                    </span>
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 hover:bg-accent"
                    onClick={() => handleSort("status")}
                  >
                    <span className="flex items-center">
                      Status
                      {getSortIcon("status")}
                    </span>
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 hover:bg-accent"
                    onClick={() => handleSort("submittedAt")}
                  >
                    <span className="flex items-center">
                      Submitted
                      {getSortIcon("submittedAt")}
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No submissions found. {searchQuery || statusFilter !== "all" || formFilter !== "all" ? "Try adjusting your filters." : "Submissions will appear here once forms are submitted."}
                  </TableCell>
                </TableRow>
              ) : (
                (sortedSubmissions as Submission[]).map((submission) => (
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
                        {submission.submitterEmail && submission.submitterEmail !== "Anonymous" ? (
                          <>
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{submission.submitterName && submission.submitterName !== "Anonymous" ? submission.submitterName : "Unknown"}</div>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                          className="h-8 px-2"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(submission.id, "reviewed")}
                          className="h-8 px-2"
                          title="Mark as Reviewed"
                          disabled={submission.status === "reviewed" || isUpdatingStatus === submission.id}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(submission.id, "archived")}
                          className="h-8 px-2"
                          title="Archive"
                          disabled={submission.status === "archived" || isUpdatingStatus === submission.id}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        {submission.status !== "new" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(submission.id, "new")}
                            className="h-8 px-2"
                            title="Mark as New"
                            disabled={isUpdatingStatus === submission.id}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(submission.id)}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          title="Delete"
                          disabled={isDeleting === submission.id}
                        >
                          <Trash2 className={`h-4 w-4 ${isDeleting === submission.id ? "opacity-50" : ""}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
