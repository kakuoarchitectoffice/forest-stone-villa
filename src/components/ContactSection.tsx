import { forwardRef } from "react";

export const ContactSection = forwardRef<HTMLElement>(function ContactSection(_, ref) {
  return (
    <section className="contact-section" ref={ref} id="contact">
      <div className="contact-section__inner">
        <p className="contact-section__kicker">CONTACT</p>
        <h2>DESIGN WITH KAKUO AI</h2>
        <p>
          AIと建築設計で、まだ見ぬ空間をかたちに。
          <br />
          生成AIによるビジュアル提案から、建築・空間デザインの構想までご相談ください。
        </p>
        <div className="contact-section__actions">
          <a className="contact-section__button" href="https://www.kakuo.jp/contact/">
            お問い合わせ
          </a>
          <a
            className="contact-section__button contact-section__button--secondary"
            download
            href={`${import.meta.env.BASE_URL}assets/documents/kakuo-ai-private-villa-presentation.pdf`}
          >
            資料ダウンロード
          </a>
        </div>
      </div>
    </section>
  );
});
