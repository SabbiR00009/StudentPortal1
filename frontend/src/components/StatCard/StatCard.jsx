import styles from './StatCard.module.scss';

export default function StatCard({ value, label, onClick }) {
  return (
    <div className={styles.statCard} onClick={onClick}>
      <h3 className={styles.value}>{value}</h3>
      <p className={styles.label}>{label}</p>
    </div>
  );
}
