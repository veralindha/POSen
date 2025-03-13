
import { Box, Flex, Heading, Spacer, Button, Text } from '@chakra-ui/react';
import { useSession, signOut } from 'next-auth/react';

const Navbar = () => {
  const { data: session } = useSession();

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      padding={4}
      bg="brand.600"
      color="white"
      boxShadow="md"
    >
      <Flex align="center" mr={5}>
        <Heading as="h1" size="lg" letterSpacing="tight">
          POS System
        </Heading>
      </Flex>

      <Spacer />

      {session && (
        <Flex align="center">
          <Text mr={4}>
            Welcome, {session.user.name} ({session.user.role})
          </Text>
          <Button
            variant="outline"
            _hover={{ bg: 'brand.700' }}
            onClick={() => signOut()}
          >
            Logout
          </Button>
        </Flex>
      )}
    </Flex>
  );
};

export default Navbar;
