
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
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React from 'react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const toast = useToast();
  const cancelRef = React.useRef();
  const { data: session } = useSession();
  const router = useRouter();

  // Form state
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (session?.user.role !== 'admin' && session?.user.role !== 'manager') {
      router.push('/');
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [session, router]);

  const handleAddCategory = () => {
    setIsEditing(false);
    setCategoryName('');
    onOpen();
  };

  const handleEditCategory = (category) => {
    setIsEditing(true);
    setSelectedCategory(category);
    setCategoryName(category.name);
    onOpen();
  };

  const handleDeleteClick = (category) => {
    setSelectedCategory(category);
    onDeleteOpen();
  };

  const handleSubmit = async () => {
    try {
      // Validate form data
      if (!categoryName.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Category name is required.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (isEditing) {
        // Update existing category
        const res = await fetch(`/api/categories/${selectedCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: categoryName,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to update category');
        }

        // Update local state
        setCategories(
          categories.map((cat) =>
            cat.id === selectedCategory.id ? { ...cat, name: categoryName } : cat
          )
        );

        toast({
          title: 'Category updated',
          description: `"${categoryName}" has been updated.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new category
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: categoryName,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to create category');
        }

        const newCategory = await res.json();

        // Update local state
        setCategories([...categories, newCategory]);

        toast({
          title: 'Category added',
          description: `"${categoryName}" has been added.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteCategory = async () => {
    try {
      const res = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete category');
      }

      // Update local state
      setCategories(categories.filter((cat) => cat.id !== selectedCategory.id));

      toast({
        title: 'Category deleted',
        description: `"${selectedCategory.name}" has been deleted.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onDeleteClose();
    } catch (error) {
      console.error('Error deleting category:', error);
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
        <Heading>Categories</Heading>
        <Button
          leftIcon={<FaPlus />}
          colorScheme="brand"
          onClick={handleAddCategory}
        >
          Add Category
        </Button>
      </Flex>

      {categories.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg" color="gray.600">
            No categories found. Start by adding a category.
          </Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Created At</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {categories.map((category) => (
                <Tr key={category.id}>
                  <Td>{category.id}</Td>
                  <Td>{category.name}</Td>
                  <Td>
                    {new Date(category.created_at).toLocaleDateString()}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit category"
                        icon={<FaEdit />}
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleEditCategory(category)}
                      />
                      <IconButton
                        aria-label="Delete category"
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteClick(category)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Add/Edit Category Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Category Name</FormLabel>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Category
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{selectedCategory?.name}"? This may affect products associated with this category.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteCategory} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Categories;
