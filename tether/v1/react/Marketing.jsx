import { useId, useState } from "react";
import { cx } from "./cx.js";

// Marketing sections. Each lays itself out by its own width (container queries in components.css), so it works in a
// column as well as a full page. Content is yours: these take text, links and children, never images they invent.

/** <Section alt eyebrow="Lineup" title="Three stages, one weekend" lead="…" center>{children}</Section> */
export function Section({ eyebrow, title, lead, center = false, alt = false, as: H = "h2", children, className, ...rest }) {
  return (
    <section className={cx("ui-section", alt && "ui-section--alt", className)} {...rest}>
      <div className="ui-section-inner">
        {title ? (
          <div className={cx("ui-section-head", center && "ui-section-head--center")}>
            {eyebrow ? <span className="ui-eyebrow">{eyebrow}</span> : null}
            <H className="ui-section-title">{title}</H>
            {lead ? <p className="ui-section-lead">{lead}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

/** <Media label="Crowd at the main stage" square />  an image's place until a real one goes in (role="img") */
export function Media({ label, square = false, className }) {
  return <div className={cx("ui-media", square && "ui-media--square", className)} role="img" aria-label={label}><span aria-hidden="true">Image</span></div>;
}

/** <SiteNav brand="BKSTG" links={[{ href: "/", label: "Lineup", current: true }]} actions={<Button variant="primary">Tickets</Button>} /> */
export function SiteNav({ brand, brandMark, links, actions, label = "Main", className }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <header className={cx("ui-sitenav", className)}>
      <div className="ui-sitenav-bar">
        <a className="ui-sitenav-brand" href="/">{brandMark}{brand}</a>
        <nav aria-label={label}><ul className="ui-sitenav-links">{links.map((l) => <li key={l.href}><a href={l.href} aria-current={l.current ? "page" : undefined}>{l.label}</a></li>)}</ul></nav>
        <div className="ui-sitenav-actions">{actions}</div>
        <button type="button" className="ui-btn ui-btn--icon ui-btn--ghost ui-sitenav-toggle" aria-expanded={open} aria-controls={id} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}</svg>
        </button>
      </div>
      <nav className="ui-sitenav-panel" id={id} aria-label={`${label}, menu`} hidden={!open}>
        {links.map((l) => <a key={l.href} href={l.href} aria-current={l.current ? "page" : undefined}>{l.label}</a>)}
        {actions}
      </nav>
    </header>
  );
}

/** <Hero eyebrow="April 17–19" title="Spring 2026" lead="…" actions={<Button variant="primary">Get tickets</Button>} media={<Media label="…" />} /> */
export function Hero({ eyebrow, title, lead, actions, media, center = false, className }) {
  return (
    <div className={cx("ui-hero", center ? "ui-hero--center" : media && "ui-hero--split", className)}>
      <div className="ui-hero-text">
        {eyebrow ? <span className="ui-eyebrow">{eyebrow}</span> : null}
        <h1 className="ui-hero-title">{title}</h1>
        {lead ? <p className="ui-hero-lead">{lead}</p> : null}
        {actions ? <div className="ui-hero-actions">{actions}</div> : null}
      </div>
      {media}
    </div>
  );
}

/** <FeatureCard icon={<MusicIcon />} title="Live set times" text="…" /> */
export function FeatureCard({ icon, title, text, children, className }) {
  return <div className={cx("ui-mk-card", className)}>{icon ? <span className="ui-feature-icon" aria-hidden="true">{icon}</span> : null}<h3>{title}</h3>{text ? <p>{text}</p> : null}{children}</div>;
}

/** <Stats items={[{ value: "42K", label: "Fans", note: "Across three days" }]} /> */
export function Stats({ items, className }) {
  return <dl className={cx("ui-stats", className)}>{items.map((s) => <div key={s.label} className="ui-stat"><dt className="ui-stat-label">{s.label}</dt><dd className="ui-stat-value" style={{ margin: 0, order: -1 }}>{s.value}</dd>{s.note ? <dd className="ui-stat-note" style={{ margin: 0 }}>{s.note}</dd> : null}</div>)}</dl>;
}

/** <LogoCloud caption="Trusted by" logos={[<img … />, …]} /> */
export function LogoCloud({ caption, logos, className }) {
  return <div className={cx("ui-logocloud", className)}>{caption ? <p>{caption}</p> : null}<ul>{logos.map((l, i) => <li key={i}>{l}</li>)}</ul></div>;
}

/** <Testimonial quote="…" name="Grace Lee" role="Head of Production" avatar={<Avatar name="Grace Lee" />} large /> */
export function Testimonial({ quote, name, role, avatar, large = false, className }) {
  return <figure className={cx("ui-quote", large && "ui-quote--large", className)}><blockquote><p style={{ margin: 0 }}>{quote}</p></blockquote><figcaption>{avatar}<span><strong>{name}</strong>{role}</span></figcaption></figure>;
}

/** <TeamMember name="Ana Ruiz" role="Front of house" bio="…" media={<Media label="Ana Ruiz" square />} /> */
export function TeamMember({ name, role, bio, media, className }) {
  return <div className={cx("ui-person", className)}>{media}<h3>{name}</h3><p className="ui-person-role">{role}</p>{bio ? <p>{bio}</p> : null}</div>;
}

/** <PostCard href="/blog/x" title="…" excerpt="…" meta={<><Badge>News</Badge> · 4 min read</>} media={<Media label="…" />} /> */
export function PostCard({ href, title, excerpt, meta, media, className }) {
  return <a className={cx("ui-post", className)} href={href}>{media}<span className="ui-post-meta">{meta}</span><h3>{title}</h3>{excerpt ? <p>{excerpt}</p> : null}</a>;
}

/** <JobList jobs={[{ href: "/jobs/1", title: "Stage manager", team: "Production", tags: ["Seasonal", "San Diego"] }]} /> */
export function JobList({ jobs, className }) {
  return <ul className={cx("ui-jobs", className)}>{jobs.map((j) => <li key={j.href} className="ui-job"><div className="ui-job-title"><a href={j.href}>{j.title}</a><span>{j.team}</span></div><div className="ui-job-tags">{(j.tags || []).map((t) => <span key={t} className="ui-badge ui-badge--outline">{t}</span>)}</div></li>)}</ul>;
}

/** <FAQ items={[{ q: "Can I re-enter?", a: "Until 6 PM." }]} />  native <details>: no script needed */
export function FAQ({ items, className }) {
  return <div className={cx("ui-faq", className)}>{items.map((it, i) => <details key={i} open={it.open}><summary>{it.q}</summary><div>{it.a}</div></details>)}</div>;
}

/** <Plan name="VIP" price="$389" per="2 days" text="…" features={["…"]} featured badge="Most popular" action={<Button variant="primary">Choose VIP</Button>} /> */
export function Plan({ name, badge, price, per, text, features, action, featured = false, className }) {
  return (
    <div className={cx("ui-plan", featured && "ui-plan--featured", className)}>
      <h3>{name}{badge ? <span className="ui-badge ui-badge--brand">{badge}</span> : null}</h3>
      <p className="ui-plan-price"><strong>{price}</strong>{per ? <span>{per}</span> : null}</p>
      {text ? <p>{text}</p> : <p />}
      <ul aria-label={`${name} includes`}>{features.map((f) => <li key={f}>{f}</li>)}</ul>
      {action}
    </div>
  );
}

/** <CTABand title="See you in April" text="…" actions={<><Button>Lineup</Button><Button variant="primary">Get tickets</Button></>} /> */
export function CTABand({ title, text, actions, className }) {
  return <section className={cx("ui-cta-band", className)}><h2>{title}</h2>{text ? <p>{text}</p> : null}{actions ? <div className="ui-hero-actions">{actions}</div> : null}</section>;
}

/**
 * <Newsletter title="Lineup news, first" text="…" onSubscribe={(email) => …} />
 * A real form: the email field is required and typed, and the result is announced.
 */
export function Newsletter({ title, text, onSubscribe, note = "One email a month. Unsubscribe anytime.", className }) {
  const id = useId();
  const [done, setDone] = useState("");
  return (
    <div className={cx("ui-newsletter", className)}>
      <div className="ui-section-head"><h2 className="ui-section-title">{title}</h2>{text ? <p className="ui-section-lead">{text}</p> : null}</div>
      <form onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("email"); onSubscribe?.(v); setDone(`Thanks. Check ${v} to confirm.`); e.currentTarget.reset(); }}>
        <div className="ui-newsletter-row"><label className="ui-sr-only" htmlFor={id}>Email</label><input className="ui-input" id={id} name="email" type="email" required autoComplete="email" placeholder="you@example.com" /><button type="submit" className="ui-btn ui-btn--primary">Subscribe</button></div>
        <small role="status">{done || note}</small>
      </form>
    </div>
  );
}

/** <Prose>{article}</Prose>  long-form text: headings, lists, quotes and figures in a readable measure */
export function Prose({ children, className }) {
  return <div className={cx("ui-prose", className)}>{children}</div>;
}

/** <Footer brand="BKSTG" blurb="…" columns={[{ title: "Festival", links: [{ href: "/lineup", label: "Lineup" }] }]} legal="© 2026 …" /> */
export function Footer({ brand, blurb, columns, legal, bottom, className }) {
  return (
    <footer className={cx("ui-footer", className)}>
      <div className="ui-footer-inner">
        <div className="ui-footer-top">
          <div className="ui-footer-brand"><strong>{brand}</strong>{blurb ? <p>{blurb}</p> : null}</div>
          {columns.map((c) => <nav key={c.title} aria-label={c.title}><h2>{c.title}</h2><ul>{c.links.map((l) => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}</ul></nav>)}
        </div>
        <div className="ui-footer-bottom"><small>{legal}</small>{bottom}</div>
      </div>
    </footer>
  );
}
