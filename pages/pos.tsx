
import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Heading,
  Flex,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Image,
  Select,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react';
import { FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

const POS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(cartTotal);
  }, [cart]);

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    
    if (existingItem) {
      const updatedCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const decreaseQuantity = (id) => {
    const updatedCart = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(item.quantity - 1, 1) }
        : item
    );
    setCart(updatedCart);
  };

  const increaseQuantity = (id) => {
    const product = products.find(p => p.id === id);
    const currentItem = cart.find(item => item.id === id);
    
    if (product && currentItem) {
      if (currentItem.quantity < product.stock) {
        const updatedCart = cart.map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        setCart(updatedCart);
      } else {
        toast({
          title: 'Stock limit reached',
          description: `Only ${product.stock} items available in stock.`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const removeFromCart = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Empty cart',
        description: 'Please add items to cart before checkout.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          payment_method: paymentMethod,
          total_amount: total,
        }),
      });

      if (!response.ok) {
        throw new Error('Transaction failed');
      }

      const data = await response.json();
      
      toast({
        title: 'Transaction completed',
        description: `Transaction #${data.id} has been processed successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Clear cart after successful transaction
      clearCart();
      onClose();
      
      // Refresh products to update stock
      const res = await fetch('/api/products');
      const updatedProducts = await res.json();
      setProducts(updatedProducts);
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Transaction failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category_id === parseInt(selectedCategory));

  return (
    <Box>
      <Heading mb={6}>Point of Sale</Heading>
      <Flex direction={{ base: 'column', lg: 'row' }} h="calc(100vh - 200px)">
        {/* Products Section */}
        <Box flex="1" mr={{ base: 0, lg: 4 }} mb={{ base: 4, lg: 0 }}>
          <Flex mb={4} justify="space-between" align="center">
            <Heading size="md">Products</Heading>
            <Select
              maxW="200px"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Flex>

          <Box
            overflowY="auto"
            h="calc(100% - 40px)"
            p={2}
            bg="gray.50"
            borderRadius="md"
          >
            <Grid
              templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }}
              gap={4}
            >
              {filteredProducts.map((product) => (
                <Box
                  key={product.id}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  bg="white"
                  onClick={() => addToCart(product)}
                  cursor={product.stock > 0 ? 'pointer' : 'not-allowed'}
                  opacity={product.stock > 0 ? 1 : 0.6}
                  _hover={{ shadow: product.stock > 0 ? 'md' : 'none' }}
                >
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      height="120px"
                      width="100%"
                      objectFit="cover"
                    />
                  ) : (
                    <Box height="120px" bg="gray.200" display="flex" alignItems="center" justifyContent="center">
                      <Text color="gray.500">No Image</Text>
                    </Box>
                  )}
                  <Box p={3}>
                    <Flex justify="space-between" align="baseline">
                      <Text fontWeight="semibold" isTruncated>{product.name}</Text>
                      <Badge colorScheme={product.stock > 0 ? 'green' : 'red'}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </Badge>
                    </Flex>
                    <Text fontWeight="bold" color="blue.600" mt={1}>
                      ${parseFloat(product.price).toFixed(2)}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Cart Section */}
        <Box width={{ base: '100%', lg: '350px' }} bg="white" p={4} borderRadius="md" boxShadow="base">
          <Heading size="md" mb={4}>
            Current Sale
          </Heading>
          
          <Box overflowY="auto" maxH="calc(100% - 180px)">
            {cart.length === 0 ? (
              <Text color="gray.500" textAlign="center" my={8}>
                Cart is empty. Add products to start a sale.
              </Text>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Item</Th>
                    <Th isNumeric>Qty</Th>
                    <Th isNumeric>Price</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {cart.map((item) => (
                    <Tr key={item.id}>
                      <Td>{item.name}</Td>
                      <Td isNumeric>
                        <HStack spacing={1} justify="flex-end">
                          <IconButton
                            aria-label="Decrease quantity"
                            icon={<FaMinus />}
                            size="xs"
                            onClick={() => decreaseQuantity(item.id)}
                          />
                          <Text>{item.quantity}</Text>
                          <IconButton
                            aria-label="Increase quantity"
                            icon={<FaPlus />}
                            size="xs"
                            onClick={() => increaseQuantity(item.id)}
                          />
                        </HStack>
                      </Td>
                      <Td isNumeric>${(item.price * item.quantity).toFixed(2)}</Td>
                      <Td>
                        <IconButton
                          aria-label="Remove item"
                          icon={<FaTrash />}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>
          
          <VStack mt={4} spacing={2} align="stretch">
            <Flex justify="space-between">
              <Text fontWeight="bold">Total:</Text>
              <Text fontWeight="bold">${total.toFixed(2)}</Text>
            </Flex>
            
            <Button colorScheme="red" size="sm" onClick={clearCart} isDisabled={cart.length === 0}>
              Clear Cart
            </Button>
            
            <Button colorScheme="green" size="lg" onClick={onOpen} isDisabled={cart.length === 0}>
              Checkout
            </Button>
          </VStack>
        </Box>
      </Flex>

      {/* Checkout Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Complete Transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Payment Method:
                </Text>
                <RadioGroup onChange={setPaymentMethod} value={paymentMethod}>
                  <Stack direction="row">
                    <Radio value="cash">Cash</Radio>
                    <Radio value="card">Card</Radio>
                    <Radio value="other">Other</Radio>
                  </Stack>
                </RadioGroup>
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Order Summary:
                </Text>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Item</Th>
                      <Th isNumeric>Qty</Th>
                      <Th isNumeric>Price</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {cart.map((item) => (
                      <Tr key={item.id}>
                        <Td>{item.name}</Td>
                        <Td isNumeric>{item.quantity}</Td>
                        <Td isNumeric>${(item.price * item.quantity).toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              
              <Flex justify="space-between" fontWeight="bold">
                <Text>Total Amount:</Text>
                <Text>${total.toFixed(2)}</Text>
              </Flex>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCheckout}>
              Complete Transaction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default POS;
