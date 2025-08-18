import type { components } from "../../shared/types";
import styles from './Tag.module.css';

type TagProps = {
    // always defined
    label: NonNullable<components["schemas"]["Task"]["tags"]>[number] | []
}

export const Tag = ({label}: TagProps) => {
    switch (label) {
        case "maison":
            return <span className={`${styles.tag} ${styles.maison}`}>🏠 maison</span>
        case "jardin":
            return <span className={`${styles.tag} ${styles.jardin}`}>🪴 jardin</span>;
        case "vélos":
            return <span className={`${styles.tag} ${styles.velos}`}>🚲 vélos</span>;
        case "voiture":
            return <span className={`${styles.tag} ${styles.voiture}`}>🚗 voiture</span>;
        default:
            return <span className={styles.tag}>Tag: {label}</span>;
    }
};