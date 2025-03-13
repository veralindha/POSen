
CREATE DATABASE IF NOT EXISTS pos_system;
USE pos_system;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'cashier', 'manager') NOT NULL DEFAULT 'cashier',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category_id INT,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'card', 'other') NOT NULL,
  status ENUM('completed', 'canceled', 'refunded') NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price_at_time DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert dummy users (passwords are hashed versions of their usernames)
INSERT INTO users (username, password, full_name, role) VALUES 
('admin', '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52', 'Admin User', 'admin'),
('john', '$2a$10$MqfPkN1NBtSlHWj3pM3.0uJx8oQEr3.UQO7yurx8jkGaNHo5A0Dei', 'John Smith', 'admin'),
('sarah', '$2a$10$F2O/bGnH8Xp0U8p6F5e8/.ZEgwWf6svZSzb4PXcQFBGrOIqV0E9Gy', 'Sarah Johnson', 'cashier'),
('mike', '$2a$10$YL13UqP7pLw8CUhGdFY3KOD9H5wCnwVNXq1DqrHzhHSJHVyHZVOdW', 'Mike Brown', 'cashier');

-- Insert some sample categories
INSERT INTO categories (name) VALUES 
('Food'), 
('Beverages'), 
('Snacks'), 
('Electronics');

-- Insert sample products
INSERT INTO products (name, description, price, stock, category_id) VALUES 
('Hamburger', 'Classic beef hamburger', 5.99, 50, 1),
('French Fries', 'Crispy golden fries', 2.99, 100, 1),
('Coca Cola', 'Refreshing soft drink', 1.99, 200, 2),
('Bottled Water', 'Pure mineral water', 0.99, 300, 2),
('Potato Chips', 'Crunchy potato chips', 1.49, 150, 3);
