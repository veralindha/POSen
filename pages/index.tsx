
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
} from '@chakra-ui/react';
import { FaUsers, FaBoxOpen, FaShoppingCart, FaDollarSign } from 'react-icons/fa';

const Home = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, usersRes, transactionsRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/users'),
          fetch('/api/transactions'),
        ]);

        const products = await productsRes.json();
        const users = await usersRes.json();
        const transactions = await transactionsRes.json();

        const revenue = transactions.reduce((total, transaction) => {
          return total + parseFloat(transaction.total_amount);
        }, 0);

        setStats({
          totalProducts: products.length,
          totalUsers: users.length,
          totalTransactions: transactions.length,
          totalRevenue: revenue,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  return (
    <Box>
      <Heading mb={6}>Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <StatCard
          title="Products"
          value={stats.totalProducts}
          icon={FaBoxOpen}
          accentColor="blue.500"
        />
        <StatCard
          title="Users"
          value={stats.totalUsers}
          icon={FaUsers}
          accentColor="green.500"
        />
        <StatCard
          title="Transactions"
          value={stats.totalTransactions}
          icon={FaShoppingCart}
          accentColor="purple.500"
        />
        <StatCard
          title="Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={FaDollarSign}
          accentColor="orange.500"
        />
      </SimpleGrid>
    </Box>
  );
};

const StatCard = ({ title, value, icon, accentColor }) => {
  return (
    <Stat
      px={4}
      py={5}
      bg="white"
      shadow="base"
      rounded="lg"
      borderLeft="4px solid"
      borderColor={accentColor}
    >
      <Box display="flex" justifyContent="space-between">
        <Box>
          <StatLabel fontSize="sm" fontWeight="medium">
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold">
            {value}
          </StatNumber>
          <StatHelpText mb={0}>Total</StatHelpText>
        </Box>
        <Box
          my="auto"
          color={accentColor}
          alignContent="center"
        >
          <Icon as={icon} w={8} h={8} />
        </Box>
      </Box>
    </Stat>
  );
};

export default Home;
