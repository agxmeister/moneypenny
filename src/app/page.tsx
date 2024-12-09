import styles from "./page.module.css"

export default function Home() {
    return (
        <div>
            <span className={styles.bold}>Miss Moneypenny</span>, later assigned the first names of <span className={styles.bold}>Eve</span> or <span className={styles.bold}>Jane</span>, is a fictional character in the <a className={styles.link} href={"https://en.wikipedia.org/wiki/James_Bond"}>James Bond</a> novels and films.
        </div>
    );
}
