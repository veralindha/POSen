
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
        // Get transaction details
        const transactions = await executeQuery({
          query: `
            SELECT t.*, u.username, u.full_name
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
          `,
          values: [id],
        });
        
        if (transactions.length === 0) {
          return res.status(404).json({ message: "Transaction not found" });
        }
        
        // Get transaction items
        const items = await executeQuery({
          query: `
            SELECT ti.*, p.name as product_name
            FROM transaction_items ti
            JOIN products p ON ti.product_id = p.id
            WHERE ti.transaction_id = ?
          `,
          values: [id],
        });
        
        return res.status(200).json({
          ...transactions[0],
          items,
        });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "PUT":
      if (session.user.role !== 'admin' && session.user.role !== 'manager') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      try {
        const { status } = req.body;
        
        await executeQuery({
          query: "UPDATE transactions SET status = ? WHERE id = ?",
          values: [status, id],
        });
        
        return res.status(200).json({ message: "Transaction updated successfully" });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    default:
      res.setHeader("Allow", ["GET", "PUT"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
