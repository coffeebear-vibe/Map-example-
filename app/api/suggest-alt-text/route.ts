import { NextRequest, NextResponse } from "next/server";
import { suggestAltText } from "@/lib/ai/suggestAltText";

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Missing imageBase64 or mimeType" },
        { status: 400 }
      );
    }

    const suggestion = await suggestAltText(imageBase64, mimeType);
    return NextResponse.json({ suggestion });
  } catch (err) {
    console.error("Alt text suggestion failed:", err);
    return NextResponse.json(
      { error: "Failed to generate alt text suggestion. Please try again." },
      { status: 400 }
    );
  }
}
