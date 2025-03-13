
import mysql from 'mysql2/promise';

export async function executeQuery({ query, values = [] }) {
  const dbConnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '0.0.0.0',
    port: 3306,
    database: process.env.MYSQL_DATABASE || 'pos_system',
    user: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  });
  
  try {
    const [results] = await dbConnection.execute(query, values);
    return results;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error(error.message);
  } finally {
    await dbConnection.end();
  }
}
