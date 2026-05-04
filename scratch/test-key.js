const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  try {
    const genAI = new GoogleGenerativeAI("AIzaSyChgNcM9TLemxCZfbD0ug0SQVzuaU7IRIo");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello!");
    console.log("Success!");
    console.log(result.response.text());
  } catch (error) {
    console.error("Error:", error.message);
  }
}
test();
