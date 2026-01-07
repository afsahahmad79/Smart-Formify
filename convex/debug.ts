import { query } from "./_generated/server";

export const listUsers = query({
  handler: async ({ db }) => {
    const users = await db.query("users").collect();
    return users.map((u) => ({
      id: u._id ? String(u._id) : null,
      email: u.email,
      name: u.name,
      role: u.role,
      tokenIdentifier: u.tokenIdentifier,
      createdAt: u.createdAt || null,
      deleted: u.deleted || false,
    }));
  },
});

