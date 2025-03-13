
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
        const transactions = await executeQuery({
          query: `
            SELECT t.*, u.username, u.full_name
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
          `,
        });
        return res.status(200).json(transactions);
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    case "POST":
      try {
        const { items, payment_method, total_amount } = req.body;
        
        // Start transaction
        const conn = await mysql.createConnection({
          host: process.env.MYSQL_HOST,
          database: process.env.MYSQL_DATABASE,
          user: process.env.MYSQL_USERNAME,
          password: process.env.MYSQL_PASSWORD,
        });
        
        await conn.beginTransaction();
        
        try {
          // Create transaction record
          const [transactionResult] = await conn.execute(
            "INSERT INTO transactions (user_id, total_amount, payment_method) VALUES (?, ?, ?)",
            [session.user.id, total_amount, payment_method]
          );
          
          const transactionId = transactionResult.insertId;
          
          // Add transaction items
          for (const item of items) {
            await conn.execute(
              "INSERT INTO transaction_items (transaction_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)",
              [transactionId, item.product_id, item.quantity, item.price]
            );
            
            // Update stock
            await conn.execute(
              "UPDATE products SET stock = stock - ? WHERE id = ?",
              [item.quantity, item.product_id]
            );
          }
          
          await conn.commit();
          
          return res.status(201).json({
            id: transactionId,
            message: "Transaction completed successfully"
          });
        } catch (error) {
          await conn.rollback();
          throw error;
        } finally {
          conn.end();
        }
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
