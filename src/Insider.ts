export default class Insider
{
    readonly url: string;
    readonly secret: string;

    constructor(url: string, secret: string)
    {
        this.url = url;
        this.secret = secret;
    }

    async publish(title: string, content: string): Promise<boolean>
    {
        console.log(`Publishing the article titled "${title}". Publication URL: "${this.url}"`);
        try {
            const response = await fetch(this.url, {
                method: "POST",
                body: JSON.stringify({
                    secret: this.secret,
                    title: title,
                    content: content,
                })
            })
            console.log(`Publication of the article titled "${title}" completed with the status "${response.status}".`);
            return response.ok;
        } catch (error) {
            console.log(`Failed to publish the article titled "${title}".`);
            return false;
        }
    }
}
