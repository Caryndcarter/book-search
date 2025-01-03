

const typeDefs = `
  # Query Type
  type Query {
    me: User
  }

  # Query Type
  type Query {
    getSingleUser(id: ID!): User
  }

  # Mutation Type
  type Mutation {
    login(email: String!, password: String!): Auth
    addUser(username: String!, email: String!, password: String!): Auth
    saveBook(book: BookInput!): User
    removeBook(bookId: String!): User
  }

  # User Type
  type User {
    _id: ID!
    username: String!
    email: String!
    password: String!
    bookCount: Int
    savedBooks: [Book]
  }

  # Book Type
  type Book {
    bookId: String!
    authors: [String]
    description: String
    title: String!
    image: String
    link: String
  }

  # Auth Type
  type Auth {
    token: String!
    user: User
  }

  # Input Type for Book
  input BookInput {
    bookId: String!
    authors: [String]
    description: String
    title: String!
    image: String
    link: String
  }
`;

export default typeDefs;
