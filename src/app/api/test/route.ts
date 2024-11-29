import {writeFile} from "node:fs";

export async function GET() {
    return Response.json({
        message: "Hello, world!",
        date: Date.now(),
    });
}

export async function POST(request: Request) {
    const blob = await request.blob();

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    writeFile("./recording.mp4", buffer, (err) => {
        if (err) {
            console.error('Error saving Blob:', err);
        } else {
            console.log('Blob saved successfully to:', "./recording.mp4");
        }
    });

    return Response.json({
        message: "Hello, world!",
        date: Date.now(),
    });
}
