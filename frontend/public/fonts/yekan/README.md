# User-provided Yekan font

The user supplied Yekan.woff, Yekan.ttf, Yekan.otf, Yekan.eot, and Yekan.vfc from their Downloads folder. The font binaries are copied without modification.

`src/app/globals.css` registers the Regular face as `Yekan`, with WOFF first and TTF/OTF/EOT fallbacks. It applies to Persian/Arabic Unicode ranges, including Persian digits. Latin characters keep the existing Arial/Helvetica stack. The previously bundled B Yekan remains a fallback.

The FontLab design source is kept at `design/fonts/Yekan.vfc` outside the public web directory; browsers cannot load VFC as a font. The license in the sibling `b-yekan` folder describes that folder's original WOFF2 file, not these user-provided assets.
