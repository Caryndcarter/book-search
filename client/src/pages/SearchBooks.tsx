import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Container, Card, Button, Row, Form, Col } from 'react-bootstrap';
import { useMutation, useQuery } from '@apollo/client';
import Auth from '../utils/auth';
import { SAVE_BOOK } from '../utils/mutations';
import { GET_ME } from '../utils/queries';
import type { Book } from '../models/Book';
import type { GoogleAPIBook } from '../models/GoogleAPIBook';

const SearchBooks = () => {
  // create state for holding returned google api data
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState('');

  // create state to hold saved bookId values
  const [savedBookIds, setSavedBookIds] = useState<string[]>([]);  

  // Apollo useQuery hook to fetch saved book IDs
  const { data } = useQuery(GET_ME, {
    skip: !Auth.loggedIn(), // Only fetch if the user is logged in
  });

  useEffect(() => {
    if (data?.me?.savedBooks) {
      const ids = data.me.savedBooks.map((book: Book) => book.bookId);
      setSavedBookIds(ids);
    }
  }, [data]);

    // Apollo useMutation hook for SAVE_BOOK
  const [saveBookMutation] = useMutation(SAVE_BOOK);

  // create method to search for books and set state on form submit
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {

      const searchGoogleBooks = async (query: string) => {
        try {
          const response = await fetch(`/api/search-books?q=${query}`);
          const data = await response.json();
  
          if (response.ok) {
            console.log('Books Data:', data);
            return data;  

          } else {
            console.log('Error:', data.error);
            return null;  
          }
        } catch (error) {
          console.error('Request failed', error);
          return null; 
        }
      };
  
      const data = await searchGoogleBooks(searchInput);  // Get the data from backend
  
      if (!data || !data.items) {
        console.error('No books data found');
        return;
      }

      const bookData = data.items.map((book: GoogleAPIBook) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
      }));

      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (err) {
      console.error(err);
    }
  };

  // create function to handle saving a book to our database
  const handleSaveBook = async (bookId: string) => {
    // find the book in `searchedBooks` state by the matching id
    const bookToSave: Book = searchedBooks.find((book) => book.bookId === bookId)!;

    console.log('Book to save:', bookToSave);

    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      // Call the saveBook mutation
      const { data } = await saveBookMutation({
        variables: {
          book: {
          bookId: bookToSave.bookId,
          authors: bookToSave.authors,
          title: bookToSave.title,
          description: bookToSave.description,
          image: bookToSave.image,
          //link: bookToSave.link,
          }
        },
      });

      if (data) {
        // Update the savedBookIds state
      // if book successfully saves to user's account, save book id to state
      setSavedBookIds([...savedBookIds, bookToSave.bookId]);
      }
      
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg'>
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className='pt-5'>
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => {
            const isSaved = savedBookIds?.includes(book.bookId);
            return (
              <Col md="4" key={book.bookId}>
                <Card border='dark'>
                  {book.image ? (
                    <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    {Auth.loggedIn() && (
                      <Button
                      disabled={isSaved}
                      className='btn-block btn-info'
                      onClick={() => handleSaveBook(book.bookId)}>
                      {isSaved ? 'This book has already been saved!' : 'Save this Book!'}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;
