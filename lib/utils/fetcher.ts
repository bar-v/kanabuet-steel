export const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    // Attach extra info to the error object.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).info = await res.json().catch(() => ({}));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
};
