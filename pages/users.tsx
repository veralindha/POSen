
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Flex,
  Text,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaPlus, FaKey } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React from 'react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isPasswordOpen,
    onOpen: onPasswordOpen,
    onClose: onPasswordClose,
  } = useDisclosure();
  const toast = useToast();
  const cancelRef = React.useRef();
  const { data: session } = useSession();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'cashier',
  });

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (session?.user.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [session, router]);

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      full_name: '',
      role: 'cashier',
    });
  };

  const resetPasswordForm = () => {
    setPasswordData({
      password: '',
      confirmPassword: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleAddUser = () => {
    setIsEditing(false);
    resetForm();
    onOpen();
  };

  const handleEditUser = (user) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name,
      role: user.role,
    });
    onOpen();
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    resetPasswordForm();
    onPasswordOpen();
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    onDeleteOpen();
  };

  const handleDeleteUser = async () => {
    // Don't allow deleting yourself
    if (selectedUser.id === session.user.id) {
      toast({
        title: 'Error',
        description: 'You cannot delete your own account.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      return;
    }

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter((u) => u.id !== selectedUser.id));
      
      toast({
        title: 'User deleted',
        description: `${selectedUser.full_name} has been deleted.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onDeleteClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate form data
      if (!formData.username || !formData.full_name || !formData.role) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (!isEditing && !formData.password) {
        toast({
          title: 'Validation Error',
          description: 'Password is required for new users.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `/api/users/${selectedUser.id}`
        : '/api/users';
      
      const userData = {
        username: formData.username,
        full_name: formData.full_name,
        role: formData.role,
      };

      // Only include password if it's provided
      if (formData.password) {
        userData.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        throw new Error('Failed to save user');
      }

      // Refresh users list
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      setUsers(usersData);

      toast({
        title: isEditing ? 'User updated' : 'User added',
        description: isEditing
          ? `${formData.full_name} has been updated.`
          : `${formData.full_name} has been added.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdatePassword = async () => {
    try {
      // Validate passwords match
      if (passwordData.password !== passwordData.confirmPassword) {
        toast({
          title: 'Validation Error',
          description: 'Passwords do not match.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (passwordData.password.length < 6) {
        toast({
          title: 'Validation Error',
          description: 'Password must be at least 6 characters.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: selectedUser.full_name,
          role: selectedUser.role,
          password: passwordData.password,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update password');
      }

      toast({
        title: 'Password updated',
        description: `Password for ${selectedUser.full_name} has been updated.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onPasswordClose();
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>User Management</Heading>
        <Button
          leftIcon={<FaPlus />}
          colorScheme="brand"
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Flex>

      {users.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg" color="gray.600">
            No users found. Start by adding a user.
          </Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Username</Th>
                <Th>Full Name</Th>
                <Th>Role</Th>
                <Th>Created At</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.id}</Td>
                  <Td>{user.username}</Td>
                  <Td>{user.full_name}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        user.role === 'admin'
                          ? 'red'
                          : user.role === 'manager'
                          ? 'purple'
                          : 'green'
                      }
                    >
                      {user.role}
                    </Badge>
                  </Td>
                  <Td>
                    {new Date(user.created_at).toLocaleDateString()}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit user"
                        icon={<FaEdit />}
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleEditUser(user)}
                      />
                      <IconButton
                        aria-label="Change password"
                        icon={<FaKey />}
                        size="sm"
                        colorScheme="yellow"
                        onClick={() => handleChangePassword(user)}
                      />
                      <IconButton
                        aria-label="Delete user"
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteClick(user)}
                        isDisabled={user.id === session?.user.id}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Add/Edit User Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'Edit User' : 'Add New User'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>Username</FormLabel>
              <Input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                isReadOnly={isEditing}
              />
            </FormControl>

            {!isEditing && (
              <FormControl mb={4} isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </FormControl>
            )}

            <FormControl mb={4} isRequired>
              <FormLabel>Full Name</FormLabel>
              <Input
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Role</FormLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </Select>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleSubmit}>
              {isEditing ? 'Update' : 'Add'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={isPasswordOpen} onClose={onPasswordClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Password for {selectedUser?.full_name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel>New Password</FormLabel>
              <Input
                type="password"
                name="password"
                value={passwordData.password}
                onChange={handlePasswordInputChange}
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPasswordClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleUpdatePassword}>
              Update Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete User
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete {selectedUser?.full_name}? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteUser} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Users;
