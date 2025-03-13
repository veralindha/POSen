
import { getServerSession } from "next-auth/next";
import { executeQuery } from "../../../lib/db";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;

  switch (req.method) {
    case "GET":
      try {
        const categories = await executeQuery({
          query: "SELECT * FROM categories WHERE id = ?",
          values: [id],
        });
        
        if (categories.length === 0) {
          return res.status(404).json({ message: "Category not found" });
        }
        
        return res.status(200).json(categories[0]);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "PUT":
      try {
        const { name } = req.body;
        
        await executeQuery({
          query: "UPDATE categories SET name = ? WHERE id = ?",
          values: [name, id],
        });
        
        return res.status(200).json({ message: "Category updated successfully" });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "DELETE":
      try {
        // First check if the category is being used by products
        const products = await executeQuery({
          query: "SELECT COUNT(*) as count FROM products WHERE category_id = ?",
          values: [id],
        });
        
        if (products[0].count > 0) {
          return res.status(400).json({ 
            message: "Cannot delete category as it is being used by products" 
          });
        }
        
        await executeQuery({
          query: "DELETE FROM categories WHERE id = ?",
          values: [id],
        });
        
        return res.status(200).json({ message: "Category deleted successfully" });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
