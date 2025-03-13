
import { Box, VStack, Button, Icon, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { 
  FaShoppingCart, 
  FaBoxOpen, 
  FaUsers, 
  FaChartLine,
  FaClipboardList
} from 'react-icons/fa';

const Sidebar = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === 'admin';
  const isManager = session?.user.role === 'admin' || session?.user.role === 'manager';

  const menuItems = [
    { name: 'POS', path: '/pos', icon: FaShoppingCart, access: true },
    { name: 'Products', path: '/products', icon: FaBoxOpen, access: isManager },
    { name: 'Categories', path: '/categories', icon: FaClipboardList, access: isManager },
    { name: 'Users', path: '/users', icon: FaUsers, access: isAdmin },
    { name: 'Transactions', path: '/transactions', icon: FaChartLine, access: true },
  ];

  return (
    <Box
      as="aside"
      w="240px"
      h="full"
      bg="white"
      boxShadow="sm"
      p={4}
    >
      <VStack spacing={3} align="stretch">
        {menuItems.map((item) => 
          item.access && (
            <Button
              key={item.path}
              leftIcon={<Icon as={item.icon} />}
              justifyContent="flex-start"
              variant={router.pathname === item.path ? 'solid' : 'ghost'}
              colorScheme={router.pathname === item.path ? 'brand' : 'gray'}
              onClick={() => router.push(item.path)}
            >
              {item.name}
            </Button>
          )
        )}
      </VStack>
    </Box>
  );
};

export default Sidebar;
