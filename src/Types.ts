export type Settings = {
    url: string,
    secret: string,
}

export type Input = {
    settings: Settings,
    userInput: string,
}

export type PublishArguments = {
    title: string,
    content: string,
}

export type OnPublish = (title: string, content: string) => Promise<boolean>;
