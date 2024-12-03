import {Transcription} from "openai/resources/audio/transcriptions";

export default class EmulatedTranscription implements Transcription
{
    text: string;
    constructor (text: string)
    {
        this.text = text;
    }
}
