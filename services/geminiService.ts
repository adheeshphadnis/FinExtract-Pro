import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TableData } from "../types";

const MODEL_NAME = "gemini-3-pro-preview";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const extractTablesFromPdf = async (file: File): Promise<TableData[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64Data = await fileToBase64(file);

  // Define the schema for structured output
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      tables: {
        type: Type.ARRAY,
        description: "List of financial and data tables extracted from the report.",
        items: {
          type: Type.OBJECT,
          properties: {
            sheetName: {
              type: Type.STRING,
              description: "A professional, concise name for the Excel sheet (e.g., 'Balance Sheet', 'Income Statement', 'Note 12 - Debt'). Max 30 chars.",
            },
            description: {
              type: Type.STRING,
              description: "Brief context about the table.",
            },
            rows: {
              type: Type.ARRAY,
              description: "The complete content of the table including all headers, sub-headers, and values.",
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING, 
                  nullable: true
                }
              }
            }
          },
          required: ["sheetName", "rows"]
        }
      }
    },
    required: ["tables"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: `You are an expert financial analyst. Your task is to extract tabular data from this annual/quarterly report into a structured format suitable for Excel.
            
            Instructions:
            1. **Identify**: Find ALL significant tables, including:
               - Primary Financial Statements (Balance Sheet, Income Statement, Cash Flow, Statement of Equity).
               - Key tables in the "Notes to Financial Statements" (e.g., Debt breakdown, Tax reconciliation, Segment reporting).
               - Operating metrics tables.
            
            2. **Extraction Rules**:
               - Capture ALL rows and columns accurately.
               - Preserve the hierarchy of headers (e.g., if a header spans multiple columns, repeat it or format it clearly in the first row).
               - Ensure numerical values are captured exactly as shown (including parentheses for negatives).
               - Do not split a single logical table into multiple parts unless necessary.
            
            3. **Naming**: 
               - Name the 'sheetName' specifically (e.g., "Consol Balance Sheet", "Inc Stmt", "Cash Flow").
               - Avoid generic names like "Table 1".
            
            4. **Exclusions**:
               - Ignore minor layout tables used for signatures or page footers.
               - Ignore very small text lists that are not true data tables.

            Return the output strictly in JSON format matching the schema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No data returned from Gemini.");
    }

    const json = JSON.parse(text);
    return json.tables || [];

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to process the document. Please ensure it is a valid PDF report.");
  }
};