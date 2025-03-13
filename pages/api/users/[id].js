
import { getServerSession } from "next-auth/next";
import { executeQuery } from "../../../lib/db";
import { authOptions } from "../auth/[...nextauth]";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'admin') {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;

  switch (req.method) {
    case "GET":
      try {
        const users = await executeQuery({
          query: "SELECT id, username, full_name, role, created_at FROM users WHERE id = ?",
          values: [id],
        });
        
        if (users.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }
        
        return res.status(200).json(users[0]);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "PUT":
      try {
        const { full_name, role, password } = req.body;
        
        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await executeQuery({
            query: "UPDATE users SET full_name = ?, role = ?, password = ? WHERE id = ?",
            values: [full_name, role, hashedPassword, id],
          });
        } else {
          await executeQuery({
            query: "UPDATE users SET full_name = ?, role = ? WHERE id = ?",
            values: [full_name, role, id],
          });
        }
        
        return res.status(200).json({ message: "User updated successfully" });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "DELETE":
      try {
        await executeQuery({
          query: "DELETE FROM users WHERE id = ?",
          values: [id],
        });
        
        return res.status(200).json({ message: "User deleted successfully" });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
