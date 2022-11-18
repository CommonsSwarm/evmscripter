import {
  Box,
  Icon as ChakraIcon,
  HStack,
  Link,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from '@chakra-ui/react';
import { LinkIcon } from '@heroicons/react/24/outline';
import styled from '@emotion/styled';

const getSocial = (url: string) => [
  {
    text: 'Copy link',
    Icon: () => (
      <ChakraIcon as={LinkIcon} boxSize={6} color="brand.green.300" />
    ),
    link: () => url,
    isExternal: false,
    onClick: (toast: (params: Record<string, any>) => void) => {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied to clipboard.',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
    },
  },
];

const CustomListItem = styled(ListItem)`
  &:hover > * {
    & > * {
      color: ${({ theme }) => theme.colors.gray['900']};
    }
  }
`;

const ShareLinkModal = ({
  isOpen,
  onClose,
  url,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  isLoading: boolean;
}) => {
  const social = getSocial(url);
  const toast = useToast();

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="white">Share to</ModalHeader>
        <ModalCloseButton />
        <ModalBody paddingX={0} paddingBottom={0}>
          {isLoading ? (
            <Box px={6} pb={6}>
              <Text fontSize={'lg'}>Creating link...</Text>
            </Box>
          ) : (
            <List>
              {social.map(
                (
                  { text, Icon, link, isExternal = true, onClick = () => true },
                  i,
                ) => {
                  return (
                    <Link
                      href={link()}
                      isExternal={isExternal}
                      onClick={() => onClick(toast)}
                      _hover={{
                        textDecoration: 'none',
                      }}
                      key={`share-link-${i}`}
                    >
                      <CustomListItem
                        transitionProperty="all"
                        transitionDuration="0.2"
                        _hover={{
                          backgroundColor: 'brand.green.300',
                        }}
                        paddingX={6}
                        paddingY={3}
                      >
                        <HStack spacing={3}>
                          <Icon />
                          <Text color="white" fontSize="xl">
                            {text}
                          </Text>
                        </HStack>
                      </CustomListItem>
                    </Link>
                  );
                },
              )}
            </List>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ShareLinkModal;
