import styles from './Sidebar.module.scss';

export default function Sidebar({ title, items, activeView, onNavigate, children }) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.card}>
        <h3 className={styles.menuTitle}>{title}</h3>
        <div className={styles.navMenu}>
          {items.map((item) => (
            <button
              key={item.view}
              className={`${styles.navBtn} ${activeView === item.view ? styles.active : ''} ${item.danger ? styles.danger : ''}`}
              onClick={() => onNavigate(item.view)}
            >
              <i className={item.icon}></i> {item.label}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
