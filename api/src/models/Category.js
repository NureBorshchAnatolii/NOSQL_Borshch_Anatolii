const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
});

categorySchema.pre('findOneAndDelete', async function () {
  const Test = require('./Test');

  const categoryId = this.getQuery()._id;
  const count = await Test.countDocuments({ categoryId });

  if (count > 0) {
    throw new Error("Category is used in tests");
  }
});

module.exports = mongoose.model("Category", categorySchema);
