import styles from "./page.module.css"

export default function Home() {
    return (
        <>Hello, <span className={styles.bold}>world</span>! Meanwhile, the Open API key is {process.env.OPENAI_API_KEY}</>
    );
}
