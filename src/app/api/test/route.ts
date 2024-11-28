export async function GET() {
    return Response.json({
        message: "Hello, world!",
        date: Date.now(),
    });
}
