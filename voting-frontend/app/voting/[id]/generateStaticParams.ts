// Generate static params for static export
export async function generateStaticParams() {
  // For static export, we'll generate some common proposal IDs
  // In a real app, you might fetch this from an API
  return [
    { id: "0" },
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
  ];
}
