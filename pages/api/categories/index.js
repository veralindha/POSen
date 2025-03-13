
import { getServerSession } from "next-auth/next";
import { executeQuery } from "../../../lib/db";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  switch (req.method) {
    case "GET":
      try {
        const categories = await executeQuery({
          query: "SELECT * FROM categories",
        });
        return res.status(200).json(categories);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "POST":
      if (session.user.role !== 'admin' && session.user.role !== 'manager') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      try {
        const { name } = req.body;
        
        const result = await executeQuery({
          query: "INSERT INTO categories (name) VALUES (?)",
          values: [name],
        });
        
        return res.status(201).json({ id: result.insertId, name });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
