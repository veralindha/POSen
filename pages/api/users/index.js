
import { getServerSession } from "next-auth/next";
import { executeQuery } from "../../../lib/db";
import { authOptions } from "../auth/[...nextauth]";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'admin') {
    return res.status(401).json({ message: "Unauthorized" });
  }

  switch (req.method) {
    case "GET":
      try {
        const users = await executeQuery({
          query: "SELECT id, username, full_name, role, created_at FROM users",
        });
        return res.status(200).json(users);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "POST":
      try {
        const { username, password, full_name, role } = req.body;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await executeQuery({
          query: "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)",
          values: [username, hashedPassword, full_name, role],
        });
        
        return res.status(201).json({ id: result.insertId, username, full_name, role });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
