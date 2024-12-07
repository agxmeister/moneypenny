export type Settings = {
    publishUrl: string,
    secret: string,
}

export type Input = {
    settings: Settings,
    userInput: string,
}

export type Tools = {
    publish: (title: string, content: string) => Promise<boolean>,
}
