import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    if (!backendUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "NEXT_PUBLIC_BACKEND_URL is not defined in environment variables",
        },
        { status: 500 }
      );
    }

    // Remove trailing slash if present
    const cleanedBackendUrl = backendUrl.replace(/\/$/, "");

    // Health endpoint
    const healthUrl = `${cleanedBackendUrl}/api/health`;

    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Backend health check failed`,
          backendUrl: healthUrl,
          status: response.status,
        },
        { status: 500 }
      );
    }

    const data = await response.json().catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Backend is healthy",
      backendUrl: healthUrl,
      status: response.status,
      data,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        message: "Error pinging backend",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}