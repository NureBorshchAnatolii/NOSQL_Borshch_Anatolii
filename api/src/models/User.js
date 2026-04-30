const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: "coordinates must be [lng, lat]",
      },
    },
    city: { type: String, default: null },
    country: { type: String, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    birthDate: { type: Date },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isDeleted: { type: Boolean, default: false },
    location: { type: locationSchema, default: undefined },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.pre(/^find/, function(next) {
  this.where({ isDeleted: false });
});

userSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { isDeleted: false } });
});

userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  await this.updateOne({ $set: { isDeleted: true } });
  throw new Error("Soft delete: prevent physical removal");
});

userSchema.index({ location: "2dsphere" }, { sparse: true });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
