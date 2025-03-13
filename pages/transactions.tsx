
import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
  Flex,
  Select,
  IconButton,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { FaEye, FaPrint, FaFileDownload } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionItems, setTransactionItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === 'admin';
  const isManager = session?.user.role === 'admin' || session?.user.role === 'manager';

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/transactions');
        const data = await res.json();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, []);

  const handleViewTransaction = async (transaction) => {
    setSelectedTransaction(transaction);
    
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`);
      const data = await res.json();
      setTransactionItems(data.items || []);
      onOpen();
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction details.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStatusChange = async (transactionId, newStatus) => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update transaction status');
      }

      // Update local state
      setTransactions(
        transactions.map((t) =>
          t.id === transactionId ? { ...t, status: newStatus } : t
        )
      );

      if (selectedTransaction?.id === transactionId) {
        setSelectedTransaction({ ...selectedTransaction, status: newStatus });
      }

      toast({
        title: 'Status updated',
        description: `Transaction #${transactionId} status updated to ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const printReceipt = () => {
    // This would ideally use a library like react-to-print
    // For now, we'll simulate by opening a new window
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Transaction #${selectedTransaction.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .receipt { width: 100%; max-width: 400px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; margin-top: 20px; text-align: right; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>POS System Receipt</h2>
              <p>Transaction #${selectedTransaction.id}</p>
              <p>Date: ${new Date(selectedTransaction.created_at).toLocaleString()}</p>
              <p>Cashier: ${selectedTransaction.full_name}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${transactionItems.map(item => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>${item.quantity}</td>
                    <td>$${parseFloat(item.price_at_time).toFixed(2)}</td>
                    <td>$${(item.quantity * parseFloat(item.price_at_time)).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              <p>Total: $${parseFloat(selectedTransaction.total_amount).toFixed(2)}</p>
              <p>Payment Method: ${selectedTransaction.payment_method}</p>
            </div>
            
            <div class="footer">
              <p>Thank you for your purchase!</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Print after a short delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const filteredTransactions = statusFilter === 'all'
    ? transactions
    : transactions.filter((t) => t.status === statusFilter);

  return (
    <Box>
      <Heading mb={6}>Transactions</Heading>
      
      <Flex mb={4} justify="space-between" align="center">
        <Box>
          <Text mb={2}>Filter by status:</Text>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            width="200px"
          >
            <option value="all">All Transactions</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
            <option value="refunded">Refunded</option>
          </Select>
        </Box>
      </Flex>

      {filteredTransactions.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg" color="gray.600">
            No transactions found.
          </Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Date</Th>
                <Th>Cashier</Th>
                <Th isNumeric>Amount</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredTransactions.map((transaction) => (
                <Tr key={transaction.id}>
                  <Td>{transaction.id}</Td>
                  <Td>
                    <Text>{new Date(transaction.created_at).toLocaleString()}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                    </Text>
                  </Td>
                  <Td>{transaction.full_name}</Td>
                  <Td isNumeric>${parseFloat(transaction.total_amount).toFixed(2)}</Td>
                  <Td>{transaction.payment_method}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        transaction.status === 'completed'
                          ? 'green'
                          : transaction.status === 'canceled'
                          ? 'red'
                          : 'yellow'
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="View transaction"
                      icon={<FaEye />}
                      size="sm"
                      colorScheme="blue"
                      mr={2}
                      onClick={() => handleViewTransaction(transaction)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Transaction Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction Details #{selectedTransaction?.id}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTransaction && (
              <Box>
                <Flex justify="space-between" mb={4}>
                  <Box>
                    <Text fontWeight="bold">Date:</Text>
                    <Text>{new Date(selectedTransaction.created_at).toLocaleString()}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Cashier:</Text>
                    <Text>{selectedTransaction.full_name}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Status:</Text>
                    {isManager ? (
                      <Select
                        size="sm"
                        value={selectedTransaction.status}
                        onChange={(e) =>
                          handleStatusChange(selectedTransaction.id, e.target.value)
                        }
                        width="140px"
                      >
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                        <option value="refunded">Refunded</option>
                      </Select>
                    ) : (
                      <Badge
                        colorScheme={
                          selectedTransaction.status === 'completed'
                            ? 'green'
                            : selectedTransaction.status === 'canceled'
                            ? 'red'
                            : 'yellow'
                        }
                      >
                        {selectedTransaction.status}
                      </Badge>
                    )}
                  </Box>
                </Flex>

                <Box mb={4}>
                  <Text fontWeight="bold" mb={2}>Items:</Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Product</Th>
                        <Th isNumeric>Qty</Th>
                        <Th isNumeric>Price</Th>
                        <Th isNumeric>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {transactionItems.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.product_name}</Td>
                          <Td isNumeric>{item.quantity}</Td>
                          <Td isNumeric>${parseFloat(item.price_at_time).toFixed(2)}</Td>
                          <Td isNumeric>
                            ${(item.quantity * parseFloat(item.price_at_time)).toFixed(2)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                <Flex justifyContent="space-between" mt={6}>
                  <Box>
                    <Text fontWeight="bold">Payment Method:</Text>
                    <Text>{selectedTransaction.payment_method}</Text>
                  </Box>
                  <Box textAlign="right">
                    <Text fontWeight="bold">Total Amount:</Text>
                    <Text fontSize="xl" fontWeight="bold">
                      ${parseFloat(selectedTransaction.total_amount).toFixed(2)}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button
                leftIcon={<FaPrint />}
                onClick={printReceipt}
                colorScheme="blue"
                variant="outline"
              >
                Print Receipt
              </Button>
              <Button colorScheme="brand" onClick={onClose}>
                Close
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Transactions;
