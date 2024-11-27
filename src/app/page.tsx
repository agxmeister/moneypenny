import styles from "./page.module.css"

export default function Home() {
    return (
        <div>Hello, <span className={styles.bold}>world</span>!</div>
    );
}
