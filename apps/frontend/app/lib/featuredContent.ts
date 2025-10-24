
// Fetch featured content from backend API (API-based implementation)
export async function getFeaturedContentData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/featured-content`);
  if (!res.ok) throw new Error('Failed to fetch featured content');
  return await res.json();
}

