
import { getServerSession } from "next-auth/next";
import { executeQuery } from "../../../lib/db";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;

  switch (req.method) {
    case "GET":
      try {
        const products = await executeQuery({
          query: `
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
          `,
          values: [id],
        });
        
        if (products.length === 0) {
          return res.status(404).json({ message: "Product not found" });
        }
        
        return res.status(200).json(products[0]);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "PUT":
      if (session.user.role !== 'admin' && session.user.role !== 'manager') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      try {
        const { name, description, price, stock, category_id, image_url } = req.body;
        
        await executeQuery({
          query: "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category_id = ?, image_url = ? WHERE id = ?",
          values: [name, description, price, stock, category_id, image_url, id],
        });
        
        return res.status(200).json({ message: "Product updated successfully" });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "DELETE":
      if (session.user.role !== 'admin' && session.user.role !== 'manager') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      try {
        await executeQuery({
          query: "DELETE FROM products WHERE id = ?",
          values: [id],
        });
        
        return res.status(200).json({ message: "Product deleted successfully" });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
