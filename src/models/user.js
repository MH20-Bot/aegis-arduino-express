import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    passwordHash: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.set('toJSON', {
  transform(document, returnedObject) {
    delete returnedObject.passwordHash;
    delete returnedObject.__v;

    return returnedObject;
  }
});

export const User = mongoose.model(
  'User',
  userSchema
);