"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  // These would be fetched from user context or API in a real app
  const [email, setEmail] = useState("afsahahmad79@gmail.com")
  const [name, setName] = useState("Afsah Ahmad")
  const [editing, setEditing] = useState(false)
  const { toast } = useToast()

  const handleSave = () => {
    // Here you would call your API/mutation to update user info
    setEditing(false)
    toast({ title: "Account updated", description: "Your account information has been updated." })
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-6">Manage your account preferences</p>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={!editing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!editing}
            />
          </div>
          <div className="flex gap-2 mt-4">
            {editing ? (
              <>
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>Edit</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
