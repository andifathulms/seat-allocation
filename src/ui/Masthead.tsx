import { S } from '../copy/strings.id';
import './masthead.css';

/**
 * The premise, stated in the space above the chamber and no more.
 *
 * Until this revision the masthead was 813 px tall on a 900 px viewport and
 * spent all of it on prose, which put the hemicycle 303 px below the fold on a
 * desktop and 592 px below it on a phone. A visitor's first view of an app
 * about the composition of a parliament contained no parliament.
 *
 * So this is now a title, a promise and one qualifying line. Everything that
 * was here and is not one of those three — the four official figures and the
 * reproduction notice — moves below the chamber into <Premise>, where it frames
 * an instrument the reader has already seen rather than delaying it.
 */
export function Masthead() {
  return (
    <header className="masthead" id="masthead">
      <div className="page masthead__inner">
        {/* The mark states nothing the h1 does not, so it is decorative here.
            Its teal cluster is the group the threshold admits — the app's
            control, never a party. */}
        <picture>
          <source
            srcSet={`${import.meta.env.BASE_URL}brand/icon-chamber.svg`}
            media="(prefers-color-scheme: dark)"
          />
          <img
            className="masthead__mark"
            src={`${import.meta.env.BASE_URL}brand/icon.svg`}
            width={36}
            height={36}
            alt=""
          />
        </picture>
        <h1 className="display masthead__title">{S.title}</h1>
        <p className="masthead__subtitle h3">{S.subtitle}</p>
        <p className="masthead__lead small">{S.lead}</p>
      </div>
    </header>
  );
}
