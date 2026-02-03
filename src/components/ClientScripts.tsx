"use client";

import Script from "next/script";

export default function ClientScripts() {
  return (
    <>
      <Script
        id="orchids-browser-logs"
        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
        strategy="afterInteractive"
        data-orchids-project-id="bae296f9-64ea-4124-b6aa-30af3af20a86"
      />
      <Script
        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
        strategy="afterInteractive"
        data-target-origin="*"
        data-message-type="ROUTE_CHANGE"
        data-include-search-params="true"
        data-only-in-iframe="true"
        data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
      />
    </>
  );
}
