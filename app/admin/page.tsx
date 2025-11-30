"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api, type Id } from "@/lib/convex";
import { useMutation } from "convex/react";

interface User {
  _id: Id<"users">;
  name: string;
  tokenIdentifier: string;
  role: "user" | "admin";
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrent);
  const users = useQuery(api.users.getAll);

  const updateRole = useMutation(api.users.updateRole);
  const deleteUser = useMutation(api.users.deleteUser);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.push("/dashboard");
    }
  }, [currentUser, router]);

  if (currentUser === undefined || users === undefined) {
    return <div>Loading...</div>;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null; // Redirect handled in useEffect
  }

  const handleUpdateRole = async (userId: Id<"users">, role: "user" | "admin") => {
    try {
      await updateRole({ id: userId, role });
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleDeleteUser = async (userId: Id<"users">) => {
    if (userId === currentUser?._id) {
      alert("Cannot delete yourself!");
      return;
    }
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser({ id: userId });
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-2 sm:px-6 lg:px-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center sm:text-left">Admin Dashboard - User Management</h1>
      <div className="overflow-x-auto rounded-lg shadow-sm bg-white">
        <Table className="min-w-full text-xs sm:text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email/Token ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: User) => (
              <TableRow key={user._id}>
                <TableCell className="whitespace-nowrap">{user.name}</TableCell>
                <TableCell className="max-w-[120px] sm:max-w-xs truncate">{user.tokenIdentifier}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleUpdateRole(user._id, value as "user" | "admin")}
                    >
                      <SelectTrigger className="w-[90px] sm:w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="ml-0 sm:ml-2"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}