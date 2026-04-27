db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["firstName", "lastName", "email", "passwordHash", "role"],
      properties: {
        _id: { bsonType: "objectId" },
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        email: {
          bsonType: "string",
          pattern: "^.+@.+\\..+$",
        },
        passwordHash: {
          bsonType: "string",
        },
        birthDate: { bsonType: ["date", "null"] },
        role: {
          bsonType: "string",
          enum: ["user", "admin"],
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
      additionalProperties: false,
    },
  },
  validationAction: "error",
});

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.createCollection("categories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name"],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string" },
      },
      additionalProperties: false,
    },
  },
  validationAction: "error",
});

db.categories.createIndex({ name: 1 }, { unique: true });

db.createCollection("tests", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "categoryId", "title", "passingScore"],
      properties: {
        _id: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        categoryId: { bsonType: "objectId" },
        title: { bsonType: "string" },
        description: { bsonType: "string" },
        passingScore: {
          bsonType: "int",
          minimum: 0,
          maximum: 100,
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },

        questions: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["text", "questionType"],
            properties: {
              _id: { bsonType: "objectId" },
              text: { bsonType: "string" },
              questionType: {
                bsonType: "string",
                enum: ["single", "multiple", "text"],
              },
              points: { bsonType: "int", minimum: 0 },
              order: { bsonType: "int", minimum: 0 },
              explanation: { bsonType: "string" },

              answers: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["text", "isCorrect"],
                  properties: {
                    _id: { bsonType: "objectId" },
                    text: { bsonType: "string" },
                    isCorrect: { bsonType: "bool" },
                    order: { bsonType: "int", minimum: 0 },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  validationAction: "error",
});

db.tests.createIndex({ userId: 1 });
db.tests.createIndex({ categoryId: 1 });
db.tests.createIndex({ createdAt: -1 });

db.createCollection("testAttempts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "testId", "status"],
      properties: {
        _id: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        testId: { bsonType: "objectId" },
        startedAt: { bsonType: "date" },
        finishedAt: { bsonType: ["date", "null"] },
        status: {
          bsonType: "string",
          enum: ["in-progress", "completed", "abandoned"],
        },
        score: { bsonType: "int", minimum: 0 },
        maxScore: { bsonType: "int", minimum: 0 },
        attemptNumber: { bsonType: "int", minimum: 1 },

        userAnswers: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["questionId"],
            properties: {
              _id: { bsonType: "objectId" },
              questionId: {
                bsonType: "objectId",
              },
              selectedAnswerId: {
                bsonType: ["objectId", "null"],
              },
              textAnswer: { bsonType: "string" },
              isCorrect: { bsonType: "bool" },
              answeredAt: { bsonType: "date" },
            },
          },
        },
      },
    },
  },
  validationAction: "error",
});

db.testAttempts.createIndex({ userId: 1 });
db.testAttempts.createIndex({ userId: 1, testId: 1 });
