
import { ReactNode, useEffect } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoginPage = router.pathname === '/login';

  useEffect(() => {
    if (status === 'unauthenticated' && !isLoginPage) {
      router.push('/login');
    }
  }, [status, router, isLoginPage]);

  if (status === 'loading') {
    return <Box p={8}>Loading...</Box>;
  }

  if (isLoginPage) {
    return <Box>{children}</Box>;
  }

  return (
    <Flex h="100vh" flexDirection="column">
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Box flex="1" p={4} overflowY="auto" bg="gray.50">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;
