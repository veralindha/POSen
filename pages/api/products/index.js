
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
        const products = await executeQuery({
          query: `
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
          `,
        });
        return res.status(200).json(products);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "POST":
      if (session.user.role !== 'admin' && session.user.role !== 'manager') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      try {
        const { name, description, price, stock, category_id, image_url } = req.body;
        
        const result = await executeQuery({
          query: "INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)",
          values: [name, description, price, stock, category_id, image_url],
        });
        
        return res.status(201).json({ id: result.insertId, name, description, price, stock, category_id, image_url });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
