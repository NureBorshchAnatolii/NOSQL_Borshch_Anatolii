const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Lab1-2",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:5000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664a1f2e8b1c2d3e4f5a6b7c" },
            firstName: { type: "string", example: "Jane" },
            lastName: { type: "string", example: "Doe" },
            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },
            birthDate: {
              type: "string",
              format: "date",
              example: "1995-06-15",
            },
            role: { type: "string", enum: ["user", "admin"], example: "user" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RegisterBody: {
          type: "object",
          required: ["firstName", "lastName", "email", "password"],
          properties: {
            firstName: { type: "string", example: "Jane" },
            lastName: { type: "string", example: "Doe" },
            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },
            password: { type: "string", minLength: 6, example: "secret123" },
            birthDate: {
              type: "string",
              format: "date",
              example: "1995-06-15",
            },
            role: { type: "string", enum: ["user", "admin"], example: "user" },
          },
        },
        LoginBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },
            password: { type: "string", example: "secret123" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: { $ref: "#/components/schemas/User" },
          },
        },

        Category: {
          type: "object",
          properties: {
            _id: { type: "string", example: "664a1f2e8b1c2d3e4f5a6b7c" },
            name: { type: "string", example: "JavaScript" },
          },
        },
        CategoryBody: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "JavaScript" },
          },
        },

        Answer: {
          type: "object",
          properties: {
            _id: { type: "string" },
            text: { type: "string", example: "Paris" },
            isCorrect: { type: "boolean", example: true },
            order: { type: "integer", example: 0 },
          },
        },
        AnswerInput: {
          type: "object",
          required: ["text", "isCorrect"],
          properties: {
            text: { type: "string", example: "Paris" },
            isCorrect: { type: "boolean", example: true },
            order: { type: "integer", example: 0 },
          },
        },
        Question: {
          type: "object",
          properties: {
            _id: { type: "string" },
            text: { type: "string", example: "What is the capital of France?" },
            questionType: {
              type: "string",
              enum: ["single", "multiple", "text"],
            },
            points: { type: "integer", example: 1 },
            order: { type: "integer", example: 0 },
            explanation: {
              type: "string",
              example: "Paris has been the capital since...",
            },
            answers: {
              type: "array",
              items: { $ref: "#/components/schemas/Answer" },
            },
          },
        },
        QuestionInput: {
          type: "object",
          required: ["text", "questionType"],
          properties: {
            text: { type: "string", example: "What is the capital of France?" },
            questionType: {
              type: "string",
              enum: ["single", "multiple", "text"],
              example: "single",
            },
            points: { type: "integer", example: 1 },
            order: { type: "integer", example: 0 },
            explanation: { type: "string" },
            answers: {
              type: "array",
              items: { $ref: "#/components/schemas/AnswerInput" },
            },
          },
        },
        Test: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { $ref: "#/components/schemas/User" },
            categoryId: { $ref: "#/components/schemas/Category" },
            title: { type: "string", example: "JS Fundamentals" },
            description: { type: "string" },
            passingScore: {
              type: "integer",
              example: 70,
              description: "Minimum percentage to pass",
            },
            questions: {
              type: "array",
              items: { $ref: "#/components/schemas/Question" },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        TestBody: {
          type: "object",
          required: ["categoryId", "title", "passingScore"],
          properties: {
            categoryId: { type: "string", example: "664a1f2e8b1c2d3e4f5a6b7c" },
            title: { type: "string", example: "JS Fundamentals" },
            description: { type: "string" },
            passingScore: { type: "integer", example: 70 },
            questions: {
              type: "array",
              items: { $ref: "#/components/schemas/QuestionInput" },
            },
          },
        },

        UserAnswer: {
          type: "object",
          properties: {
            questionId: { type: "string" },
            selectedAnswerId: { type: "string", nullable: true },
            textAnswer: { type: "string" },
            isCorrect: { type: "boolean" },
            answeredAt: { type: "string", format: "date-time" },
          },
        },
        TestAttempt: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { $ref: "#/components/schemas/User" },
            testId: { $ref: "#/components/schemas/Test" },
            startedAt: { type: "string", format: "date-time" },
            finishedAt: { type: "string", format: "date-time", nullable: true },
            status: {
              type: "string",
              enum: ["in-progress", "completed", "abandoned"],
            },
            score: { type: "integer" },
            maxScore: { type: "integer" },
            attemptNumber: { type: "integer" },
            userAnswers: {
              type: "array",
              items: { $ref: "#/components/schemas/UserAnswer" },
            },
          },
        },
        FinishResult: {
          type: "object",
          properties: {
            attempt: { $ref: "#/components/schemas/TestAttempt" },
            score: { type: "integer", example: 8 },
            maxScore: { type: "integer", example: 10 },
            percentage: { type: "integer", example: 80 },
            passed: { type: "boolean", example: true },
            passingScore: { type: "integer", example: 70 },
          },
        },

        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "Something went wrong" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
