import { forwardRef } from "react";

type ContactSectionProps = { onBackToTop: () => void };

export const ContactSection = forwardRef<HTMLElement, ContactSectionProps>(function ContactSection({ onBackToTop }, ref) {
  return <section className="contact-section" ref={ref} id="contact" aria-labelledby="contact-heading">
    <div className="contact-section__inner">
      <p className="contact-section__kicker">08 / 08 — CONTACT</p>
      <h2 id="contact-heading">{"まずは、\nご相談ください。"}</h2>
      <p>ご相談内容が決まっていなくても、お気軽にお問い合わせください。</p>
      <div className="contact-section__actions">
        <a className="contact-section__button" download="KAKUO AI Company Profile.pdf" href={`${import.meta.env.BASE_URL}assets/documents/KAKUO%20AI%20Company%20Profile.pdf`}>資料ダウンロード</a>
        <a className="contact-section__button contact-section__button--secondary" href="https://www.kakuo.jp/contact/" target="_blank" rel="noopener noreferrer">お問い合わせ</a>
      </div>
      <a className="contact-section__parent" href="https://kakuo.jp/concept" target="_blank" rel="noopener noreferrer">カクオ・アーキテクト・オフィス ↗</a>
      <button className="contact-section__back" type="button" onClick={onBackToTop}>最初へ戻る ↑</button>
    </div>
  </section>;
});
