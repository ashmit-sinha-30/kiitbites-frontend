import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

        if (!backendUrl) {
            return NextResponse.json(
                { success: false, message: 'NEXT_PUBLIC_BACKEND_URL is not defined in environment variables' },
                { status: 500 }
            );
        }

        // Ping the backend
        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            return NextResponse.json({
                success: true,
                message: `Successfully pinged backend at ${backendUrl}`,
                status: response.status
            });
        } else {
            return NextResponse.json({
                success: false,
                message: `Failed to ping backend. Received status: ${response.status}`,
                status: response.status
            }, { status: 500 });
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { success: false, message: `Error pinging backend: ${errorMessage}` },
            { status: 500 }
        );
    }
}
