import { Link } from 'react-router-dom';
import s from './public.module.scss';

export default function Banner({ title, crumb }) {
  return (
    <section className={s.banner}>
      <div className={s.container}>
        <h1 className={s.bannerTitle}>{title}</h1>
        <div className={s.breadcrumb}>
          <Link to="/">Home</Link> &nbsp;/&nbsp; {crumb || title}
        </div>
      </div>
    </section>
  );
}
