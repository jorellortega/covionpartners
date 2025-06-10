import { useEffect } from 'react';

export function AdsenseAd() {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client="ca-pub-5771281829620343"
      data-ad-slot="6157997000"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
} 