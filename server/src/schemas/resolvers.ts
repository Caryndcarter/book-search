import User from '../models/User.js';
import { signToken } from '../services/auth.js';
import { GraphQLError } from 'graphql';


const resolvers = {
  Query: {
    // get a single user by either their id or their username
    getSingleUser: async (_parent:any, {id, username}: {id?: string; username?: string}, _context:any) => {
      const foundUser = await User.findOne({
        $or: [{_id: id}, { username}], 
      });

      if (!foundUser) {
        throw new GraphQLError('Cannot find a user with this id!');
      }
      return foundUser;
    },

    me: async (_parent:any, _args:any, context:any) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated');
      }
      try {
        const user = await User.findById(context.user._id).populate('savedBooks');
        return user;
      } catch (err) {
        console.error('Error fetching user:', err);
        throw new GraphQLError('Error fetching user');
      }
    },
  },
  

  Mutation: {
    // create a user, sign a token, and send it back (to client/src/components/SignUpForm.js
    addUser: async (_parent:any, { username, email, password } : { username: string; email: string; password: string }) => {
      console.log('Inputs:', { username, email, password });
      
      const user = await User.create({ username, email, password });
    
      if (!user) {
        throw new GraphQLError('Something is Wrong! Creating user failed');
      }
    
      const token = signToken(user.username, user.password, user._id);
      return { token, user };
    },

    // login a user, sign a token, and send it back (to client/src/components/LoginForm.js)
    login: async (_parent: any, { username, email, password }: { username?: string; email?: string; password: string }) => {
      const user = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (!user) {
        throw new GraphQLError("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new GraphQLError('Wrong password');
      }

      const token = signToken(user.username, user.password, user._id);
      return { token, user };
    },

    // save a book to a user's `savedBooks` field by adding it to the set (to prevent duplicates)
    saveBook: async (_parent: any, { book }: { book: { bookId: string; title: string; authors: string[] } }, context: any) => {
      if (!context.user) {
        console.log('No user in context:', context.user);
        throw new GraphQLError('You must be logged in');
      }

      try {

        console.log('Attempting to update user with book:', book);

        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: book } },
          { new: true, runValidators: true }
        );

        console.log('Updated user:', updatedUser);

        if (!updatedUser) {
          console.log('User not found or update failed.');
          throw new GraphQLError('Error saving book: User not found or update failed.');
        }

        return updatedUser;
      } catch (err) {
        console.log('Error saving book:', err);
        throw new GraphQLError('Error saving book.');
      }
    },

    // remove a book from `savedBooks`
    removeBook: async (_parent: any, { bookId }: { bookId: string }, context: any) => {
      if (!context.user) {
        throw new GraphQLError('You must be logged in!');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );

      if (!updatedUser) {
        throw new GraphQLError("Couldn't find user with this id!");
      }

      return updatedUser;
    },

  },
};

export default resolvers;