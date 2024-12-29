import express from 'express';
import path from 'node:path';
import db from './config/connection.js';
import fetch from 'node-fetch';
//import routes from './routes/index.js';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs, resolvers } from './schemas/index.js';
import { fileURLToPath } from 'url';
import { authenticateToken } from './services/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Create a route for Google Books API
app.get('/api/search-books', async (req, res) => {
  const query = req.query.q;  // Query parameter passed from the frontend

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const apiKey = process.env.VITE_GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key is missing' });
  }

  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&printType=books&maxResults=10&key=${apiKey}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Something wrong with the Google Books API request' });
  }
});

const startApolloServer = async () => {
  await server.start();
  
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  
  app.use('/graphql', expressMiddleware(server as any,
    {
      context: authenticateToken as any
    }
  ));

  //app.use(routes);

  app.use(express.static(path.join(__dirname, '../../client/dist')));

  app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
  
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));

  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
    console.log(`Use GraphQL at http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();