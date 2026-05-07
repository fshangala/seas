import { createAgent } from "langchain";
import { openaiModel } from "../models/openai_model";
import * as z from "zod";

const markingKeyResponseSchema = z.object({
    correct_option_id: z.string().nullable().describe("The ID of the correct option for multiple-choice questions. Null if not applicable."),
    correct_text_match: z.string().nullable().describe("The text that represents the correct answer for text-based questions."),
    grading_notes: z.string().describe("Additional notes for grading student responses."),
    is_auto_mark: z.boolean().describe("Indicates whether the marking is done automatically."),
    question_id: z.string().describe("The ID of the question for which the marking key is generated."),
});

export default createAgent({
    model: openaiModel,
    systemPrompt: "You are a helpful assistant that generates marking keys for assessments. Based on the assessment content, create a marking key that outlines the criteria for grading student responses.",
    tools: [],
    responseFormat: markingKeyResponseSchema,
});